import * as ecs from 'bitecs';
import { Heading, HeadingVectors, rotateHeading, xy } from "../world/parameters";
import { EntityBuilder } from '../../util/entityBuilder';
import { SpriteConfig, WhenSpriteCreated } from '../systems/spriteManager';
import { flagForCleanup } from '../systems/cleanupSystem';

export function makeWindBlastForking(
    world: ecs.World,
    originator: Phaser.GameObjects.Sprite,
    heading: Heading,
    effectsGroup: Phaser.Physics.Arcade.Group,
    cloneLevel: number
) {

    new EntityBuilder(world)
        .addAoS(SpriteConfig, {
            x: originator.x,
            y: originator.y,
            textureKey: 'flares',
            frame: 'white'
        })
        .createRelated(WhenSpriteCreated, (blast: Phaser.GameObjects.Sprite) => {

            effectsGroup.add(blast);
            const body = blast.body as Phaser.Physics.Arcade.Body;
            blast.setScale(0.5);
            blast.setData('originator', originator);
            body.setCircle(40, blast.width/2 * blast.scaleX, blast.height/2 * blast.scaleY);

            body.setVelocity(...xy(heading, Phaser.Math.Between(800, 1200)));
            body.setAcceleration(...xy(heading, -2000));

            blast.data.set('hasHit', [] as number[]);

            if (cloneLevel > 0) {
                blast.on('destroy', () => {
                    for (const i of [-3, -2, -1, 0, 1, 2, 3, 4] as const) {
                        const decrease = Phaser.Math.Between(0, 15) < 15 ? 1 : 0;
                        makeWindBlastForking(world, blast, rotateHeading(heading, i), effectsGroup, cloneLevel - decrease);
                    }
                });
            }
            flagForCleanup(world, blast.data.get('eid'), 350 + Phaser.Math.Between(0, 200));
        });
}

// This approach is gonna be mega bugged
export const EffectOf = ecs.createRelation(
    ecs.withAutoRemoveSubject,
    ecs.makeExclusive,
    ecs.withStore(() => [] as { tag: string, effects: any }[] )
);

export class BreathAttack {

    constructor(world: ecs.World, eid: number, sprite: Phaser.GameObjects.Sprite, effectGroup: Phaser.Physics.Arcade.Group, heading: Heading, x: number, y: number) {

        const headingVector = HeadingVectors[heading];
        const baseAngle = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));

        const particles = sprite.scene.add.particles(x, y, 'flares', {
            frame: 'white',
            color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
            colorEase: 'quad.out',
            lifespan: 1000 * sprite.scale,
            scale: {
                start: 0.4 * sprite.scale,
                end: 1.4 * sprite.scale,
                ease: 'sine.out'
            },
            speed: 600 / (sprite.scale + 1),
            angle: {min: baseAngle - 20, max: baseAngle + 20},
            advance: 200,
            frequency: 20,
            blendMode: 'ADD',
            active: true,
        });
        particles.setDepth(11);

        // Repeatedly shoot damaging projectiles while breathing.
        const timer = sprite.scene.time.addEvent({
            startAt: 100,
            delay: 100,
            loop: true,
            callback: () => {
                new EntityBuilder(world)
                    .addAoS(SpriteConfig, {
                        x: x,
                        y: y,
                        textureKey: '',
                        frame: ''
                    })
                    .createRelated(WhenSpriteCreated, (projectile: Phaser.GameObjects.Sprite) => {
                        projectile.setVisible(false);
                        effectGroup.add(projectile);
                        const body = projectile.body as Phaser.Physics.Arcade.Body;
                        body.setCircle(50, -25, -25);

                        body.setVelocity(...xy(heading, 800));

                        projectile.data.set('hasHit', [] as number[]);

                        flagForCleanup(world, projectile.data.get('eid'), 200);
                    });
            }
        });

        new EntityBuilder(world, eid)
            .createRelated(EffectOf, { tag: 'breathAttackParticles', effects: {particles: particles, timer: timer} });
    }
}
