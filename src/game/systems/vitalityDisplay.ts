import * as ecs from 'bitecs';
import { Vitality } from './damageSystem';
import { SpriteOf } from './spriteManager';

const VitalityBarFor = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    ecs.withStore(() => [] as Phaser.GameObjects.Graphics[] )
);

export class VitalityBarManager {
    constructor(private world: ecs.World, private scene: Phaser.Scene) {}

    public createBars() {

        for (const eid of ecs.query(this.world, [
            Vitality,
            ecs.Not(ecs.Wildcard(VitalityBarFor)),
            ecs.Wildcard(SpriteOf)
        ])) {
            const sprite = SpriteOf(ecs.query(this.world, [SpriteOf(eid)])[0])[eid]; // Should be exactly one sprite.

            const graphics = this.createGraphics(sprite);

            // Mark that we've created a vitality bar for this entity.
            const barEID = ecs.addEntity(this.world);
            ecs.addComponent(this.world, barEID, VitalityBarFor(eid));
            VitalityBarFor(barEID)[eid] = graphics as Phaser.GameObjects.Graphics; // Placeholder, not used.
        }
    }

    public updateBars() {
        for (const eid of ecs.query(this.world, [
            Vitality,
            ecs.Wildcard(VitalityBarFor),
            ecs.Wildcard(SpriteOf)
        ])) {
            const sprite = SpriteOf(ecs.query(this.world, [SpriteOf(eid)])[0])[eid];
            const graphics = VitalityBarFor(ecs.query(this.world, [VitalityBarFor(eid)])[0])[eid];

            const bounds = sprite.getBounds();
            const barHeight = 4;

            graphics.clear();
            graphics.fillStyle(0x000000);
            graphics.fillRect(
                bounds.left,
                bounds.top - barHeight - 2,
                bounds.width + 2,
                barHeight
            );

            const healthRatio = Vitality.current[eid] / Vitality.max[eid];
            graphics.fillStyle(0xbd0000);
            graphics.fillRect(
                bounds.left,
                bounds.top - barHeight - 2,
                bounds.width * healthRatio,
                barHeight
            );
            graphics.fillStyle(0xff8484);
            graphics.fillRect(
                bounds.left,
                bounds.top - barHeight - 2,
                bounds.width * healthRatio,
                barHeight / 2
            );
        }
    }

    private createGraphics(sprite: Phaser.Physics.Arcade.Sprite) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(20);
        sprite.on('destroy', () => graphics.destroy() );
        return graphics;
    }

}   