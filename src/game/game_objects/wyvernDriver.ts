import { StateMachine } from '../../util/stateMachine';
import { Broadcaster } from '../../util/broadcaster';
import { Heading, HeadingVectors, xy } from '../world/parameters';
import { WyvernAnimation } from './animatedWyvern';

type WyvernState = 'Idle' | 'Move' | 'Dash' | 'WingBlast' | 'BreathAttack';

class Controls {
    constructor(
        public steer: Heading | undefined = undefined,
        public dash: boolean = false,
        public wingBlast: boolean = false,
        public breathe: boolean = false,
    ) {}
}

export class WyvernDriver {

    public comms = new Broadcaster<{
        stop: () => void,
        go: (vector: Phaser.Math.Vector2, scale: number) => void,
        setHeading: (heading: Heading) => void,
        setAnimation: (animation: WyvernAnimation) => void,
        useSkill: (callback: (
            sprite: Phaser.GameObjects.Sprite,
            effectsGroup: Phaser.Physics.Arcade.Group,
            heading: Heading,
        ) => void ) => void,
    }>();

    private controlBridge = new Controls();

    public takeControls() {
        this.controlBridge = new Controls();
        return this.controlBridge;
    }

    public startTick(scene: Phaser.Scene) {
        this.fsm.startTick(scene);
    }

    // This timerate control is a hack and I don't like it.
    private timeRate: number = 1.0;
    public setTimeRate(rate: number) { this.timeRate = Math.max(rate, 0.1); } // To prevent divide-by-zero.
    private ms(ms: number) { return ms / this.timeRate; }

    private fsm: StateMachine<WyvernState>;

    constructor() {

        this.fsm = new StateMachine<WyvernState>('Idle')

            .when('enter_Idle', () => {
                this.comms.broadcast('setAnimation', 'Idle');
                this.comms.broadcast('stop');
            })
            .when('tick_Idle', () => {
                if (this.controlBridge.dash) { this.fsm.go('Dash'); }
                else if (this.controlBridge.wingBlast) { this.fsm.go('WingBlast'); }
                else if (this.controlBridge.breathe) { this.fsm.go('BreathAttack'); }
                else if (this.controlBridge.steer) { this.fsm.go('Move'); }
            })
            
            .when('enter_Move', () => this.comms.broadcast('setAnimation', 'Move'))
            .when('leave_Move', () => this.comms.broadcast('stop'))
            .when('tick_Move', () => {
                if (this.controlBridge.dash) { this.fsm.go('Dash'); }
                else if (this.controlBridge.wingBlast) { this.fsm.go('WingBlast'); }
                else if (this.controlBridge.breathe) { this.fsm.go('BreathAttack'); }
                else if (this.controlBridge.steer) {
                    this.comms.broadcast('setHeading', this.controlBridge.steer);
                    this.comms.broadcast('go', HeadingVectors[this.controlBridge.steer], 1.0);
                }
                else { this.fsm.go('Idle'); }
            })
            
            .when('enter_Dash', () => {
                this.comms.broadcast('setAnimation', 'Dash');
                this.comms.broadcast('useSkill', (sprite, _, heading) => {
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
                            this.comms.broadcast('go', headingVector, 6.0);
                        }
                    });
                    sprite.scene.time.delayedCall(500, () => this.fsm.go('Idle'), [], this);
                });
            })
            .when('enter_WingBlast', () => {
                this.comms.broadcast('setAnimation', 'WingBlast');
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
                this.comms.broadcast('setAnimation', 'BreathAttack');
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
            .when('tick_BreathAttack', () => {
                if (this.controlBridge.dash) { this.fsm.go('Dash'); }
                else if (!this.controlBridge.breathe) { this.fsm.go('Idle'); }
            })
        ;

    }

}
