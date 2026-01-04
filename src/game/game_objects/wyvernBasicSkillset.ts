import { StateMachine } from '../../util/stateMachine';
import { Communicator } from '../../util/communicator';
import { Heading, HeadingVectors } from '../world/parameters';
import { WyvernAnimation } from './wyvernAnimationDriver';

type WyvernState = 'Idle' | 'Move' | 'Dash' | 'WingBlast' | 'BreathAttack' | 'InterruptBreath' | 'Done';

export type Controls = {
    steer: (heading: Heading | undefined) => void,
    dash: () => void,
    wingBlast: () => void,
    breath: () => void,
    interruptBreath: () => void,
}

export class WyvernBasicSkillset {

    public comms = new Communicator<{
        stop: () => void,
        go: (vector: Phaser.Math.Vector2, scale: number) => void,
        setHeading: (heading: Heading) => void,
        setAnimation: (animation: WyvernAnimation) => void,
        useSkill: (callback: (
            sprite: Phaser.GameObjects.Sprite,
            heading: Heading,
        ) => void ) => void,
    }>();

    public listenTo(bridge: Communicator<Controls>) {
        return bridge
            .when('steer', (heading) => this.aim = heading)
            .when('breath', () => this.fsm.send('BreathAttack'))
            .when('interruptBreath', () => this.fsm.send('InterruptBreath'))
            .when('dash', () => this.fsm.send('Dash'))
            .when('wingBlast', () => this.fsm.send('WingBlast'))
        ;
    }

    public startTick(scene: Phaser.Scene) {
        this.fsm.startTick(scene);
    }

    // This timerate control is a hack and I don't like it.
    private timeRate: number = 1.0;
    public setTimeRate(rate: number) { this.timeRate = Math.max(rate, 0.1); } // To prevent divide-by-zero.
    private ms(ms: number) { return ms / this.timeRate; }

    private aim: Heading | undefined = undefined;
    private fsm: StateMachine<WyvernState>;

    constructor() {

        var flames: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

        this.fsm = new StateMachine<WyvernState>('Idle')
            .allow('Idle', 'BreathAttack')
            .allow('Idle', 'Dash')
            .allow('Idle', 'WingBlast')
            .allow('Idle', 'Move')

            .allow('Move', 'Idle')
            .allow('Move', 'Dash')
            .allow('Move', 'BreathAttack')
            .allow('Move', 'WingBlast')

            .allow('Dash', 'Done')
            .allow('WingBlast', 'Done')
            .allow('Done', 'Idle')
            .allow('BreathAttack', 'InterruptBreath')
            .allow('InterruptBreath', 'Idle')

            .when('enter_Idle', () => {
                this.comms.send('setAnimation', 'Idle');
                this.comms.send('stop');
            })
            .when('tick_Idle', () => {
                if (this.aim) {
                    this.fsm.send('Move');
                }
            })
                          
            .when('enter_Move', () => this.comms.send('setAnimation', 'Move'))
            .when('leave_Move', () => this.comms.send('stop'))
            .when('tick_Move', () => {
                if (this.aim) {
                    this.comms.send('setHeading', this.aim);
                    this.comms.send('go', HeadingVectors[this.aim], 1.0);
                }
                else {
                    this.fsm.send('Idle');
                }
            })
            
            .when('enter_Dash', () => {
                this.comms.send('setAnimation', 'Dash');
                this.comms.send('useSkill', (sprite, heading) => {
                    const headingVector = HeadingVectors[heading];
                    sprite.scene.tweens.add({
                        targets: sprite,
                        // Make wyvern disappear then reappear at high speed.
                        alpha: { from: 1, to: 0 },
                        ease: 'Cubic.inOut',
                        duration: 250,
                        yoyo: true,
                        onYoyo: () => {
                            // On yoyo (halfway point), set high speed.
                            this.comms.send('go', headingVector, 6.0);
                        }
                    });
                    sprite.scene.time.delayedCall(500, () => this.fsm.send('Done'), [], this);
                });
            })
            .when('enter_WingBlast', () => {
                this.comms.send('setAnimation', 'WingBlast');
                this.comms.send('useSkill', (sprite, heading) => {

                    const headingVector = HeadingVectors[heading];

                    const shockwave = sprite.scene.add.particles(sprite.x, sprite.y, 'flares', {
                        frame: 'white',
                        lifespan: 400 * sprite.scale,
                        color: [parseInt('#d4ff8f'.substring(1), 16)],
                        scale: 0.04,
                        alpha: {
                            start: 5.0,
                            end: 0.0,
                            ease: 'Cubic.out'
                        },
                        speed: 600,
                        angle: { min: 0, max: 360, steps: 360 },
                        quantity: 360,
                        blendMode: 'NORMAL',
                        emitting: false
                    });
                    shockwave.setDepth(1);

                    // Extra shockwaves for larger wyverns.
                    const shockwaveCount = Math.floor(sprite.scale**2 * 4);
                    for (let i = 0; i <= shockwaveCount; i++) {
                        sprite.scene.time.delayedCall(i*20*sprite.scale + this.ms(120), () => {
                            shockwave.emitParticle();
                        });
                    }

                    const breathPoint = {
                        x: sprite.x + headingVector.x * 50 * sprite.scale,
                        y: sprite.y + headingVector.y * 50 * sprite.scale
                    };
                    const base = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));
                    const cone = {min: base - 20, max: base + 20, steps: 40};

                    const blast = sprite.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
                        frame: 'white',
                        color: [0],
                        lifespan: 300 * sprite.scale,
                        scale: {
                            start: 0.2 * sprite.scale,
                            end: 0.0 * sprite.scale,
                            ease: 'Cubic.out'
                        },
                        alpha: {
                            start: 0.5,
                            end: 0.0,
                            ease: 'Cubic.out'
                        },
                        speed: 1200,
                        angle: cone,
                        blendMode: 'NORMAL',
                        emitting: false,
                    });
                    //sprite.scene.time.delayedCall(this.ms(200), () => blast.start());
                    //sprite.scene.time.delayedCall(this.ms(400), () => blast.stop());

                    sprite.scene.time.delayedCall(this.ms(500), () => {                    
                        shockwave.destroy();
                        blast.destroy();
                        this.fsm.send('Done');
                    });
                });
            })
            .when('enter_BreathAttack', () => {
                this.comms.send('setAnimation', 'BreathAttack');
                this.comms.send('useSkill', (sprite, heading) => {

                    const headingVector = HeadingVectors[heading];

                    const breathPoint = {
                        x: sprite.x + headingVector.x * 50 * sprite.scale,
                        y: sprite.y + headingVector.y * 50 * sprite.scale
                    };
                    const base = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));
                    const cone = {min: base - 20, max: base + 20};

                    flames = sprite.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
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
                    flames.setDepth(1);
                });
            })
            .when('leave_BreathAttack', () => {
                if (flames) {
                    flames.stop();
                    flames.destroy();
                    flames = null;
                }
            })
            .when('enter_InterruptBreath', () => this.fsm.send('Idle'))
            .when('enter_Done', () => this.fsm.send('Idle'))
        ;

    }

}
