import * as ecs from 'bitecs';
import { Cleanup } from './cleanupSystem';
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

    constructor(private scene: Phaser.Scene, private world: ecs.World) {}

    public createSprites() {
        for (const eid of ecs.query(this.world, [SpriteConfig, ecs.Not(Sprite)])) {

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
            new EntityBuilder(this.world, eid).addAoS(Sprite, sprite as Phaser.Physics.Arcade.Sprite);

            // Invoke and then remove any on-create scripts.
            for (const callbackEID of ecs.query(this.world, [WhenSpriteCreated(eid)])) {
                const callback = WhenSpriteCreated(callbackEID)[eid];
                callback(sprite);
                ecs.removeEntity(this.world, callbackEID);
            }
        }
    }

    public cleanupSprites() {
        for (const eid of ecs.query(this.world, [Sprite, Cleanup])) {
            if (Cleanup.when[eid] <= 0) {
                const sprite = Sprite[eid];
                ecs.removeComponent(this.world, eid, Sprite);
                sprite.destroy();
            }
        }
    }
}