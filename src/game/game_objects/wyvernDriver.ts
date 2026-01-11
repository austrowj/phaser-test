import { Heading, HeadingVectors, xy } from '../world/parameters';
import { ChangeAnimation, ChangeHeading, SpriteComponent } from './animatedWyvern';

import * as ecs from 'bitecs';
import { addSimpleEC } from '../../util/initComponent';

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
}

export const ArcadeBody = [] as Phaser.Physics.Arcade.Body[];
export const ActiveEffect = [] as number[];
export const Particles = [] as Phaser.GameObjects.Particles.ParticleEmitter[];

export function createWyvernDriverSystem(world: ecs.World) {

    return () => {

        for (const eid of ecs.query(world, [Wyvern, WyvernCommand, SpriteComponent, ArcadeBody, Heading]) ) {

            const sprite = SpriteComponent[eid];
            const heading = Heading[eid];
            const timeRate = Wyvern.timeRate[eid];
            const effectsGroup = Wyvern.effectsGroup[eid];

            switch (WyvernCommand[eid]) {

                case 'stop':
                    Wyvern.state[eid] = 'Idle';
                    addSimpleEC(world, eid, ChangeAnimation, 'Idle');
                    ArcadeBody[eid].setVelocity(0, 0);
                    
                    if (ecs.hasComponent(world, eid, ActiveEffect)) {
                        ecs.removeComponent(world, eid, ActiveEffect);
                    }
                    break;

                case 'dash':
                    ArcadeBody[eid].setVelocity(0, 0);
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
                            ArcadeBody[eid].setVelocity(...xy(Heading[eid], Wyvern.topSpeed[eid] / Wyvern.scale[eid] * 6.0));
                        }
                    });
                    sprite.scene.time.delayedCall(500, () => addSimpleEC(world, eid, WyvernCommand, 'stop'));
                    break;

                case 'wingblast':
                    ArcadeBody[eid].setVelocity(0, 0);
                    Wyvern.state[eid] = 'WingBlast';
                    addSimpleEC(world, eid, ChangeAnimation, 'WingBlast');

                    const blast = effectsGroup.create(sprite.x, sprite.y, 'flares', 'white', false, false);
                    const body = blast.body! as Phaser.Physics.Arcade.Body;
                    blast.setScale(0.5);
                    body.setCircle(30, blast.width/2 * blast.scaleX, blast.height/2 * blast.scaleY);

                    sprite.scene.time.delayedCall(140 / timeRate, () => {
                        blast.visible = true;
                        blast.active = true;
                        body.setVelocity(...xy(heading, 800));
                    });

                    sprite.scene.time.delayedCall(500 / timeRate, () => {
                        addSimpleEC(world, eid, WyvernCommand, 'stop');
                    });
                    sprite.scene.time.delayedCall(2000 / timeRate, () => {
                        blast.destroy();
                    });
                    break;
                    
                case 'breathattack':
                    ArcadeBody[eid].setVelocity(0, 0);
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

                    const flamesEID = ecs.addEntity(world);
                    addSimpleEC(world, flamesEID, Particles, sprite.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
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
                    }));
                    Particles[flamesEID].setDepth(11);
                    console.log('Created particle emitter', flamesEID);

                    addSimpleEC(world, eid, ActiveEffect, flamesEID);
                    const unsubscribe = ecs.observe(world, ecs.onRemove(ActiveEffect), (effectEID) => {
                        console.log('Removing active effect', effectEID);
                        if (effectEID == eid) {
                            Particles[flamesEID].stop();
                            // Delay destruction to allow particles to finish.
                            Particles[flamesEID].scene.time.delayedCall(1000, () => {
                                Particles[flamesEID].destroy();
                                ecs.removeEntity(world, flamesEID);
                                unsubscribe();
                            });
                        }
                    });

                    break;
            }
            ecs.removeComponent(world, eid, WyvernCommand);
        }

        for (const eid of ecs.query(world, [Wyvern, Controls]) ) {
            switch (Wyvern.state[eid]) {

                case 'Idle':
                    if (Controls.dash[eid]) { addSimpleEC(world, eid, WyvernCommand, 'dash'); }
                    else if (Controls.wingBlast[eid]) { addSimpleEC(world, eid, WyvernCommand, 'wingblast'); }
                    else if (Controls.breathe[eid]) { addSimpleEC(world, eid, WyvernCommand, 'breathattack'); }
                    else if (Controls.steer[eid]) {
                        Wyvern.state[eid] = 'Move';
                        addSimpleEC(world, eid, ChangeAnimation, 'Move')

                        const newHeading = Controls.steer[eid];
                        if (ecs.hasComponent(world, eid, Heading)) { addSimpleEC(world, eid, ChangeHeading, newHeading); }
                        if (ecs.hasComponent(world, eid, ArcadeBody)) {
                            ArcadeBody[eid].setVelocity(...xy(newHeading, Wyvern.topSpeed[eid] / Wyvern.scale[eid]));
                        }
                    }

                    break;

                case 'Move':
                    if (Controls.dash[eid]) { addSimpleEC(world, eid, WyvernCommand, 'dash'); }
                    else if (Controls.wingBlast[eid]) { addSimpleEC(world, eid, WyvernCommand, 'wingblast'); }
                    else if (Controls.breathe[eid]) { addSimpleEC(world, eid, WyvernCommand, 'breathattack'); }
                    else if (Controls.steer[eid]) {

                        const newHeading = Controls.steer[eid];
                        if (ecs.hasComponent(world, eid, Heading)) { addSimpleEC(world, eid, ChangeHeading, newHeading); }
                        if (ecs.hasComponent(world, eid, ArcadeBody)) {
                            ArcadeBody[eid].setVelocity(...xy(newHeading, Wyvern.topSpeed[eid] / Wyvern.scale[eid]));
                        }
                    }
                    else {
                        Wyvern.state[eid] = 'Idle';
                        addSimpleEC(world, eid, ChangeAnimation, 'Idle');
                        if (ecs.hasComponent(world, eid, ArcadeBody)) { ArcadeBody[eid].setVelocity(0, 0); }
                    }

                    break;
                
                case 'BreathAttack':
                    
                    if (Controls.dash[eid]) {
                        addSimpleEC(world, eid, WyvernCommand, 'dash');
                    }
                    else if (!Controls.breathe[eid]) {
                        addSimpleEC(world, eid, WyvernCommand, 'stop');
                    }
            }
        }
    }
}
