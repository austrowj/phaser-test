import { Heading, HeadingVectors, xy } from '../world/parameters';
import { ChangeAnimation, ChangeHeading } from './animatedWyvern';

import * as ecs from 'bitecs';
import { addSimpleEC } from '../../util/initComponent';
import { makeWindBlast, makeWindBlastForking } from './skillEffects';

export type WyvernState = 'Idle' | 'Move' | 'Dash' | 'WingBlast' | 'BreathAttack';

export const Controls = {
    steer: [] as (Heading | undefined)[],
    dash: [] as boolean[],
    wingBlast: [] as boolean[],
    breathe: [] as boolean[],
}

export const WyvernCommand = [] as ('stop' | 'dash' | 'wingblast' | 'breathattack')[];

export const Wyvern = {
    timeRate: [] as number[],
    state: [] as WyvernState[],
    scale: [] as number[],
    topSpeed: [] as number[],
    effectsGroup: [] as Phaser.Physics.Arcade.Group[],
    sprite: [] as Phaser.GameObjects.Sprite[],
    body: [] as Phaser.Physics.Arcade.Body[],
    heading: [] as Heading[],
    particles: [] as (Phaser.GameObjects.Particles.ParticleEmitter | null)[],
}

export const ActiveEffect = [] as number[];

export function createWyvernDriverSystem(world: ecs.World) {

    const steer = (eid: number, h: Heading) => {
        Wyvern.heading[eid] = h;
        addSimpleEC(world, eid, ChangeHeading, h);
        Wyvern.body[eid].setVelocity(...xy(h, Wyvern.topSpeed[eid] / Wyvern.scale[eid]));
    }

    return () => {

        for (const eid of ecs.query(world, [Wyvern, WyvernCommand]) ) {

            const sprite = Wyvern.sprite[eid];
            const heading = Wyvern.heading[eid];
            const timeRate = Wyvern.timeRate[eid];
            const effectsGroup = Wyvern.effectsGroup[eid];

            switch (WyvernCommand[eid]) {

                case 'stop':
                    Wyvern.state[eid] = 'Idle';
                    addSimpleEC(world, eid, ChangeAnimation, 'Idle');
                    Wyvern.body[eid].setVelocity(0, 0);
                    
                    if (ecs.hasComponent(world, eid, ActiveEffect)) {
                        ecs.removeComponent(world, eid, ActiveEffect);
                    }
                    break;

                case 'dash':
                    Wyvern.body[eid].setVelocity(0, 0);
                    Wyvern.state[eid] = 'Dash';
                    addSimpleEC(world, eid, ChangeAnimation, 'Dash');

                    sprite.scene.tweens.add({
                        targets: sprite,
                        // Make wyvern disappear then reappear at high speed.
                        alpha: { from: 1, to: 0 },
                        ease: 'Cubic.inOut',
                        duration: 250,
                        yoyo: true,
                        onYoyo: () => {
                            // On yoyo (halfway point), set high speed.
                            Wyvern.body[eid].setVelocity(...xy(Wyvern.heading[eid], Wyvern.topSpeed[eid] / Wyvern.scale[eid] * 6.0));
                        }
                    });
                    sprite.scene.time.delayedCall(500, () => addSimpleEC(world, eid, WyvernCommand, 'stop'));
                    break;

                case 'wingblast':
                    Wyvern.body[eid].setVelocity(0, 0);
                    Wyvern.state[eid] = 'WingBlast';
                    addSimpleEC(world, eid, ChangeAnimation, 'WingBlast');
                    sprite.scene.time.delayedCall(140 / timeRate, () => makeWindBlastForking(sprite, heading, effectsGroup) );
                    sprite.scene.time.delayedCall(500 / timeRate, () => addSimpleEC(world, eid, WyvernCommand, 'stop') );
                    break;
                    
                case 'breathattack':
                    Wyvern.body[eid].setVelocity(0, 0);
                    Wyvern.state[eid] = 'BreathAttack';
                    addSimpleEC(world, eid, ChangeAnimation, 'BreathAttack');

                    //const effectEID = ecs.addComponent(world, eid, ActiveEffect);

                    // Compute starting point and angle for the breath attack.
                    const headingVector = HeadingVectors[heading];
                    const breathPoint = {
                        x: sprite.x + headingVector.x * 50 * sprite.scale,
                        y: sprite.y + headingVector.y * 50 * sprite.scale
                    };
                    const base = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));

                    Wyvern.particles[eid] = sprite.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
                        frame: 'white',
                        color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
                        colorEase: 'quad.out',
                        lifespan: 1000 * sprite.scale,
                        scale: {
                            start: 0.8 * sprite.scale,
                            end: 0.1 * sprite.scale,
                            ease: 'sine.out'
                        },
                        speed: 600 / (sprite.scale + 1),
                        angle: {min: base - 20, max: base + 20},
                        advance: 200,
                        frequency: 20,
                        blendMode: 'ADD',
                        active: true,
                        //duration: 1000,
                    });
                    Wyvern.particles[eid].setDepth(11);

                    break;
            }
            ecs.removeComponent(world, eid, WyvernCommand);
        }

        for (const eid of ecs.query(world, [Wyvern, Controls]) ) {
            switch (Wyvern.state[eid]) {

                case 'Idle':
                    if (Controls.dash[eid]) { addSimpleEC(world, eid, WyvernCommand, 'dash'); }
                    else if (Controls.wingBlast[eid]) { addSimpleEC(world, eid, WyvernCommand, 'wingblast'); }
                    else if (Controls.breathe[eid]) {
                        addSimpleEC(world, eid, WyvernCommand, 'breathattack');
                    }
                    else if (Controls.steer[eid]) {
                        Wyvern.state[eid] = 'Move';
                        addSimpleEC(world, eid, ChangeAnimation, 'Move');
                        steer(eid, Controls.steer[eid]);
                    }
                    break;

                case 'Move':
                    if (Controls.dash[eid]) { addSimpleEC(world, eid, WyvernCommand, 'dash'); }
                    else if (Controls.wingBlast[eid]) { addSimpleEC(world, eid, WyvernCommand, 'wingblast'); }
                    else if (Controls.breathe[eid]) {
                        addSimpleEC(world, eid, WyvernCommand, 'breathattack');
                    }
                    else if (Controls.steer[eid]) { steer(eid, Controls.steer[eid]); }
                    else { addSimpleEC(world, eid, WyvernCommand, 'stop'); }
                    break;
                
                case 'BreathAttack':
                    
                    if (Controls.dash[eid]) {
                        addSimpleEC(world, eid, WyvernCommand, 'dash');
                        
                        const particles = Wyvern.particles[eid]!;
                        particles.stop();
                        // Delay destruction to allow particles to finish.
                        particles.scene.time.delayedCall(1000, () => {
                            particles.destroy();
                        });
                    }
                    else if (!Controls.breathe[eid]) {
                        addSimpleEC(world, eid, WyvernCommand, 'stop');

                        const particles = Wyvern.particles[eid]!;
                        particles.stop();
                        // Delay destruction to allow particles to finish.
                        particles.scene.time.delayedCall(1000, () => {
                            particles.destroy();
                        });
                    }
            }
        }
    }
}
