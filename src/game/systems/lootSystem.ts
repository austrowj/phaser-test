import * as ecs from 'bitecs';
import { Cleanup } from './cleanupSystem';
import { Sprite } from './spriteManager';
import { spellIcons } from '../data/spritesheetMaps';
import { Player } from '../scenes/Game';

export const Loot = {} as const;

export function lootSystem(world: ecs.World) {
    for (const eid of ecs.query(world, [Sprite, Loot, Cleanup])) {
        if (Cleanup.when[eid] <= 0 && !Cleanup.alive[eid]) {
            
            const sprite = Sprite[eid];
            const count = -5*Math.log(Phaser.Math.Between(1, 100)/100);
            const playerEID = (ecs.query(world, [Sprite, Player]))[0]; // Just assume one exists

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
                active: true, /*
                moveToX: {
                    onUpdate: (particle: Phaser.GameObjects.Particles.Particle, key: string, value: any, t: number) => {
                        const distance = Phaser.Math.Distance.Between(
                            particle.x, particle.y,
                            Sprite[playerEID].x, Sprite[playerEID].y
                        );
                        return (distance < 1000) ? Sprite[playerEID].x : undefined;
                    }
                },
                moveToY: {
                    onUpdate: (particle: Phaser.GameObjects.Particles.Particle, key: string, value: any, t: number) => {
                        const distance = Phaser.Math.Distance.Between(
                            particle.x, particle.y,
                            Sprite[playerEID].x, Sprite[playerEID].y
                        );
                        return (distance < 1000) ? Sprite[playerEID].y : undefined;
                    }
                }, */
            });
            sprite.scene.time.delayedCall(5000, () => particles.destroy() );
        }
    }
}