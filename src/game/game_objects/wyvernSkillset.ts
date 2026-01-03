import { StateMachine } from '../../util/stateMachine';
import { Communicator } from '../../util/communicator';
import { Heading, WyvernAnimation, Headings } from './wyvernAnimationDriver';

type WyvernState = 'Idle' | 'Move' | 'Dash' | 'BreathAttack' | 'InterruptBreath' | 'Done';

export type Controls = {
    steer: (heading: Heading | undefined) => void,
    dash: () => void,
    breath: () => void,
    interruptBreath: () => void,
}

export class WyvernSkillset {

    public comms = new Communicator<{
        stop: () => void,
        go: (vector: Phaser.Math.Vector2, scale: number) => void,
        setHeading: (heading: Heading) => void,
        setAnimation: (animation: WyvernAnimation) => void,
        useSkill: (callback: (
            sprite: Phaser.GameObjects.Sprite,
            headingVector: Phaser.Math.Vector2
        ) => void ) => void,
    }>();

    public connectControls(bridge = new Communicator<Controls>()) {
        return bridge
            .when('steer', (heading) => this.aim = heading)
            .when('breath', () => this.fsm.send('BreathAttack'))
            .when('interruptBreath', () => this.fsm.send('InterruptBreath'))
            .when('dash', () => this.fsm.send('Dash'))
        ;
    }

    public startTick(scene: Phaser.Scene) {
        this.fsm.startTick(scene);
    }

    private aim: Heading | undefined = undefined;
    private fsm: StateMachine<WyvernState>;
    private flames: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    constructor() {

        this.fsm = new StateMachine<WyvernState>('Idle')
            .allow('Idle', 'Move')
            .allow('Idle', 'Dash')
            .allow('Idle', 'BreathAttack')

            .allow('Move', 'Idle')
            .allow('Move', 'Dash')
            .allow('Move', 'BreathAttack')

            .allow('Dash', 'Done')
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
                          
            .when('enter_Move', () => { this.comms.send('setAnimation', 'Move'); })
            .when('leave_Move', () => { this.comms.send('stop'); })
            .when('tick_Move', () => {
                if (this.aim) {
                    this.comms.send('setHeading', this.aim);
                    this.comms.send('go', Headings[this.aim].vector, 1.0);
                }
                else {
                    this.fsm.send('Idle');
                }
            })
            
            .when('enter_Dash', () => {
                this.comms.send('setAnimation', 'Dash');
                this.comms.send('useSkill', (sprite, headingVector) => {
                    sprite.scene.tweens.add({
                        targets: sprite,
                        // Make wyvern disappear then reappear at high speed.
                        alpha: { from: 1, to: 0 },
                        ease: 'Cubic.inOut',
                        duration: 250,
                        yoyo: true,
                        onYoyo: () => {
                            // On yoyo (halfway point), set high speed.
                            this.comms.send('go', headingVector, 8.0);
                        }
                    });
                    sprite.scene.time.delayedCall(500, () => this.fsm.send('Done'), [], this);
                });
            })
            .when('enter_BreathAttack', () => {
                this.comms.send('setAnimation', 'BreathAttack');
                this.comms.send('useSkill', (sprite, headingVector) => {

                    const breathPoint = {
                        x: sprite.x + headingVector.x * 50 * sprite.scale,
                        y: sprite.y + headingVector.y * 50 * sprite.scale
                    };
                    const base = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));
                    const cone = {min: base - 20, max: base + 20};

                    this.flames = sprite.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
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
                    this.flames.setDepth(1);
                });
            })
            .when('leave_BreathAttack', () => {
                if (this.flames) {
                    this.flames.stop();
                    this.flames.destroy();
                    this.flames = null;
                }
            })
            .when('enter_InterruptBreath', () => { this.fsm.send('Idle'); })
            .when('enter_Done', () => { this.fsm.send('Idle'); })
        ;

        //this.sprite.postFX.addGlow(parseInt('#ffffff'.substring(1), 16), 2, 0.5, false, .1, 4);
    }

}
