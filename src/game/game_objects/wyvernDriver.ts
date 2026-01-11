import { StateMachine } from '../../util/stateMachine';
import { Broadcaster } from '../../util/broadcaster';
import { Heading, HeadingVectors, xy } from '../world/parameters';
import { ChangeAnimation, ChangeHeading } from './animatedWyvern';

import * as ecs from 'bitecs';
import { addSimpleEC } from '../../util/initComponent';

export type WyvernState = 'Idle' | 'Move' | 'Dash' | 'WingBlast' | 'BreathAttack';

export const Controls = {
    steer: [] as (Heading | undefined)[],
    dash: [] as boolean[],
    wingBlast: [] as boolean[],
    breathe: [] as boolean[],
}

export const WyvernCommand = [] as ('stop' | 'move' | 'dash')[];

export const Wyvern = {
    timeRate: [] as number[],
    state: [] as WyvernState[],
    scale: [] as number[],
    topSpeed: [] as number[],
}

export const ArcadeBody = [] as Phaser.Physics.Arcade.Body[];

export function driveWyverns(world: ecs.World) {

    for (const eid of ecs.query(world, [Wyvern, WyvernCommand]) ) {
        switch (WyvernCommand[eid]) {

            case 'stop':
                Wyvern.state[eid] = 'Idle';
                addSimpleEC(world, eid, ChangeAnimation, 'Idle');
                if (ecs.hasComponent(world, eid, ArcadeBody)) { ArcadeBody[eid].setVelocity(0, 0); }

                break;

            case 'move':
                Wyvern.state[eid] = 'Move';
                addSimpleEC(world, eid, ChangeAnimation, 'Move')
                if (ecs.hasComponent(world, eid, ArcadeBody) && ecs.hasComponent(world, eid, Heading)) {
                    ArcadeBody[eid].setVelocity(...xy(Heading[eid], Wyvern.topSpeed[eid] / Wyvern.scale[eid]));
                }

                break;
/*
            case 'dash':
                Wyvern.state[eid] = 'Dash';
                addSimpleEC(world, eid, ChangeAnimation, 'Dash');
                if (ecs.hasComponent(world, eid, ArcadeBody) && ecs.hasComponent(world, eid, Heading)) {
                    ArcadeBody[eid].setVelocity(...xy(Heading[eid], Wyvern.topSpeed[eid] / Wyvern.scale[eid] * 6.0));
                }*/
        }
        ecs.removeComponent(world, eid, WyvernCommand);
    }

    for (const eid of ecs.query(world, [Wyvern, Controls]) ) {
        switch (Wyvern.state[eid]) {

            case 'Idle':
                //if (Wyvern.controls[eid]?.dash) { Wyvern.fsm[eid].go('Dash'); }
                //else if (Wyvern.controls[eid]?.wingBlast) { Wyvern.fsm[eid].go('WingBlast'); }
                //else if (Wyvern.controls[eid]?.breathe) { Wyvern.fsm[eid].go('BreathAttack'); }
                if (Controls.steer[eid]) {
                    addSimpleEC(world, eid, ChangeHeading, Controls.steer[eid]);
                    addSimpleEC(world, eid, WyvernCommand, 'move');
                }

                break;

            case 'Move':
                //if (Wyvern.controls[eid]?.dash) { Wyvern.fsm[eid].go('Dash'); }
                //else if (Wyvern.controls[eid]?.wingBlast) { Wyvern.fsm[eid].go('WingBlast'); }
                //else if (Wyvern.controls[eid]?.breathe) { Wyvern.fsm[eid].go('BreathAttack'); }
                if (Controls.steer[eid]) {
                    addSimpleEC(world, eid, ChangeHeading, Controls.steer[eid]);
                    addSimpleEC(world, eid, WyvernCommand, 'move');
                }
                else { addSimpleEC(world, eid, WyvernCommand, 'stop') }

                break;
        }
    }
}

export class WyvernDriver {

    public comms = new Broadcaster<{
        useSkill: (callback: (
            sprite: Phaser.GameObjects.Sprite,
            effectsGroup: Phaser.Physics.Arcade.Group,
            heading: Heading,
        ) => void ) => void,
    }>();

    public startTick(scene: Phaser.Scene) {
        this.fsm.startTick(scene);
    }

    // This timerate control is a hack and I don't like it.
    private timeRate: number = 1.0;
    public setTimeRate(rate: number) { this.timeRate = Math.max(rate, 0.1); } // To prevent divide-by-zero.
    private ms(ms: number) { return ms / this.timeRate; }

    private fsm: StateMachine<WyvernState>;

    constructor(world: ecs.World, eid: number) {

        this.fsm = new StateMachine<WyvernState>('Idle')
            
            .when('enter_Dash', () => {
                addSimpleEC(world, eid, WyvernCommand, 'dash');
                this.comms.broadcast('useSkill', (sprite) => {
                    sprite.scene.tweens.add({
                        targets: sprite,
                        // Make wyvern disappear then reappear at high speed.
                        alpha: { from: 1, to: 0 },
                        ease: 'Cubic.inOut',
                        duration: 250,
                        yoyo: true,
                        onYoyo: () => {
                            // On yoyo (halfway point), set high speed.
                            addSimpleEC(world, eid, WyvernCommand, 'dash');
                        }
                    });
                    sprite.scene.time.delayedCall(500, () => addSimpleEC(world, eid, WyvernCommand, 'stop'));
                });
            })
            .when('enter_WingBlast', () => {
                addSimpleEC(world, eid, ChangeAnimation, 'WingBlast');
                this.comms.broadcast('useSkill', (sprite, effectsGroup, heading) => {
                    const blast = effectsGroup.create(sprite.x, sprite.y, 'flares', 'white', false, false);
                    const body = blast.body! as Phaser.Physics.Arcade.Body;
                    blast.setScale(0.5);

                    sprite.scene.time.delayedCall(this.ms(140), () => {
                        blast.visible = true;
                        blast.active = true;
                        body.setVelocity(...xy(heading, 800));
                    });

                    sprite.scene.time.delayedCall(this.ms(500), () => {
                        this.fsm.go('Idle');
                    });
                    sprite.scene.time.delayedCall(this.ms(2000), () => {
                        blast.destroy();
                    });
                });
            })
            .when('enter_BreathAttack', () => {

                addSimpleEC(world, eid, WyvernCommand, 'stop');
                addSimpleEC(world, eid, ChangeAnimation, 'BreathAttack');

                this.comms.broadcast('useSkill', (sprite, _, heading) => {

                    const headingVector = HeadingVectors[heading];

                    const breathPoint = {
                        x: sprite.x + headingVector.x * 50 * sprite.scale,
                        y: sprite.y + headingVector.y * 50 * sprite.scale
                    };
                    const base = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));
                    const cone = {min: base - 20, max: base + 20};

                    const flames = sprite.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
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
                        angle: cone,
                        advance: 200,
                        frequency: 20,
                        blendMode: 'ADD',
                        //duration: 1000,
                    });
                    flames.setDepth(11);

                    this.fsm.once('leave_BreathAttack', () => {
                        flames.stop();
                        sprite.scene.time.delayedCall(1000, () => {
                            flames.destroy();
                        });
                    });
                });
            })
/*
            .when('tick_BreathAttack', () => {
                if (this.controlBridge.dash) {
                    addSimpleEC(world, eid, WyvernCommand, 'dash');
                    this.fsm.go('Dash');
                }
                else if (!this.controlBridge.breathe) {
                    addSimpleEC(world, eid, WyvernCommand, 'stop');
                    this.fsm.go('Idle');
                }
            })*/
        ;

    }

}
