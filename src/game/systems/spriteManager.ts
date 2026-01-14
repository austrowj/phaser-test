import * as ecs from 'bitecs';
import { WhenCleanedUp } from './cleanupSystem';
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

export const SpriteOf = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    ecs.withStore(() => [] as Phaser.Physics.Arcade.Sprite[] )
);

export const WhenSpriteCreated = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    // The callback will be passed the EID of the _parent_ entity. It's the same as the one in the sprite's data property.
    // DO NOT destroy the sprite yourself, flag the parent entity for cleanup instead.
    ecs.withStore(() => [] as ((parentEID: number, sprite: Phaser.GameObjects.Sprite) => void)[] )
);

export class SpriteManager {

    constructor(private scene: Phaser.Scene, private world: ecs.World) {}

    public createSprites() {
        for (const eid of ecs.query(this.world, [ecs.Not(ecs.Wildcard(SpriteOf)), SpriteConfig])) {
            // Will find anything with a SpriteConfig but no sprite yet.
            // No need for special tag.

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
            const spriteEID = ecs.addEntity(this.world);
            ecs.addComponent(this.world, spriteEID, SpriteOf(eid));
            SpriteOf(spriteEID)[eid] = sprite as Phaser.Physics.Arcade.Sprite;

            // Attach a script to destroy the sprite when the parent entity is cleaned up.
            // I don't like this way of doing it though, TODO figure out a good way to bake it in.
            new EntityBuilder(this.world, eid).createRelated(
                WhenCleanedUp, () => sprite.destroy()
            );

            // Invoke and then remove any on-create scripts.
            for (const callbackEID of ecs.query(this.world, [WhenSpriteCreated(eid)])) {
                const callback = WhenSpriteCreated(callbackEID)[eid];
                callback(eid, sprite);
                ecs.removeEntity(this.world, callbackEID);
            }
        }
    }
}