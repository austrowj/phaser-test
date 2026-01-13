import * as ecs from 'bitecs';

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

export const SpriteCreatedCallback = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    ecs.withStore(() => [] as ((sprite: Phaser.GameObjects.Sprite) => void)[] )
);

export class SpriteManager {

    constructor(private scene: Phaser.Scene, private world: ecs.World) {}

    public createSprites() {
        for (const eid of ecs.query(this.world, [ecs.Not(HasSprite), SpriteConfig])) {

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

            ecs.addComponent(this.world, eid, HasSprite);

            for (const callbackEID of ecs.query(this.world, [SpriteCreatedCallback(eid)])) {
                const callback = SpriteCreatedCallback(callbackEID)[eid];
                callback(sprite);
                ecs.removeEntity(this.world, callbackEID);
            }
        }
    }

    public destroySprites() {
    }
}

const HasSprite = {};