import * as ecs from 'bitecs';
import { flagForCleanup, WhenCleanedUp } from './cleanupSystem';
import { EntityBuilder } from '../../util/entityBuilder';

export type SpriteConfig = {[k in keyof typeof SpriteConfig]: typeof SpriteConfig[k]};
export const SpriteConfig = [] as {
    x: number,
    y: number,
    textureKey: string,
    frame?: string | number,
    origin?: [number, number],
    scale?: number,
    depth?: number,
}[];

export const Sprite = [] as Phaser.Physics.Arcade.Sprite[];

export const WhenSpriteCreated = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    ecs.withStore(() => [] as ((sprite: Phaser.GameObjects.Sprite) => void)[] )
);

export class SpriteManager {

    private spriteGroup: Phaser.GameObjects.Group;

    constructor(private scene: Phaser.Scene, private world: ecs.World) {
        this.spriteGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Sprite,
            runChildUpdate: true,
            maxSize: 500,
            active: false,
            visible: false,
        });
    }

    public createSprites() {
        for (const eid of ecs.query(this.world, [SpriteConfig, ecs.Not(Sprite)])) {
            // Will find anything with a SpriteConfig but no sprite yet.
            // No need for special tag.
            //console.log('SpriteManager: creating sprite for entity', eid);

            /*
            if (this.spriteGroup.isFull()) {
                flagForCleanup(this.world, eid);
                console.warn('SpriteManager: out of sprites, flagging entity for cleanup', eid);
                continue;
            }
            */

            const sprite = this.scene.add.sprite(
                SpriteConfig[eid].x,
                SpriteConfig[eid].y,
                SpriteConfig[eid].textureKey,
                SpriteConfig[eid].frame
            );

            if (SpriteConfig[eid].origin) sprite.setOrigin(...SpriteConfig[eid].origin);
            if (SpriteConfig[eid].scale)  sprite.setScale(SpriteConfig[eid].scale);
            if (SpriteConfig[eid].depth)  sprite.setDepth(SpriteConfig[eid].depth);
            sprite.setData('eid', eid);

            this.scene.physics.add.existing(sprite);

            // Create an entity for the sprite.
            const spriteBuilder = new EntityBuilder(this.world, eid)
                .addAoS(Sprite, sprite as Phaser.Physics.Arcade.Sprite)

            // Attach a script to destroy the sprite when the parent entity is cleaned up.
            // I don't like this way of doing it though, TODO figure out a good way to bake it in.
                .createRelated(
                    WhenCleanedUp, (_: number) => { sprite.scene.time.delayedCall(0, () => sprite.destroy()); }
                );

            // Invoke and then remove any on-create scripts.
            for (const callbackEID of ecs.query(this.world, [WhenSpriteCreated(eid)])) {
                const callback = WhenSpriteCreated(callbackEID)[eid];
                callback(sprite);
                ecs.removeEntity(this.world, callbackEID);
            }
        }
    }
}