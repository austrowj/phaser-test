import * as ecs from 'bitecs';
import { Cleanup } from './cleanupSystem';
import { Sprite } from './spriteManager';
import { spellIcons } from '../data/spritesheetMaps';

export const Loot = {} as const;

export function lootSystem(world: ecs.World) {
    for (const eid of ecs.query(world, [Sprite, Loot, Cleanup])) {
        if (Cleanup.when[eid] <= 0 && !Cleanup.alive[eid]) {
            
            const sprite = Sprite[eid];
            const count = -5*Math.log(Phaser.Math.Between(1, 100)/100);

            const particles = sprite.scene.add.particles(sprite.x, sprite.y, 'spellIcons', {
                frame: spellIcons.indexOf.Coin,
                scaleX: {values: [.5, 0, .5, 0, .5] },
                lifespan: count > 0 ? {min: 800, max: 1500} : {min: 2000, max: 2500},
                scaleY: 0.5,
                speed: {min: 150, max: 450},
                angle: {min: 255, max: 285},
                bounce: .8,
                gravityY: 1200,
                bounds: new Phaser.Geom.Rectangle(sprite.x - 400, sprite.y - 200, 800, 220),
                advance: 50,
                frequency: 10,
                stopAfter: count > 0 ? count : 150,
                blendMode: 'Normal',
                active: true,
            });
            sprite.scene.time.delayedCall(5000, () => particles.destroy() );
        }
    }
}