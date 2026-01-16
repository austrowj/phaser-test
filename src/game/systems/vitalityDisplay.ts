import * as ecs from 'bitecs';
import { Vitality } from './damageSystem';
import { Sprite } from './spriteManager';
import { EntityBuilder } from '../../util/entityBuilder';

const VitalityBar = [] as Phaser.GameObjects.Graphics[];

export class VitalityBarManager {
    constructor(private world: ecs.World, private scene: Phaser.Scene) {}

    public createBars() {

        for (const eid of ecs.query(this.world, [Vitality, ecs.Not(VitalityBar), Sprite])){
            new EntityBuilder(this.world, eid).addAoS(VitalityBar, this.createGraphics(Sprite[eid]));
        }
    }

    public updateBars() {
        for (const eid of ecs.query(this.world, [Vitality, VitalityBar, Sprite])) {
            const sprite = Sprite[eid];
            const graphics = VitalityBar[eid];

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