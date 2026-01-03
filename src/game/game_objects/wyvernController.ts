import { WyvernDriver, Heading } from './wyvernDriver';
import { StateMachine } from '../../util/stateMachine';

type Action = 'Idle' | 'Move' | 'Dash' | 'BreathAttack' | 'Interrupt_Breath' | 'Done';

const sizeConfig = {
    'small':  { scale: 0.25, rate: 18, topSpeed: 300 },
    'medium': { scale: 0.50, rate: 12, topSpeed: 200 },
    'large':  { scale: 1.00, rate:  8, topSpeed: 150 }
}

export class WyvernController extends Phaser.GameObjects.GameObject {

    private currentSpeed = 0;
    private topSpeed: number;

    private wyvernBody: Phaser.Physics.Arcade.Body;

    public setSpeedFraction(fraction: number) {
        this.currentSpeed = Math.max(fraction * this.topSpeed, 0);
    }

    private headingKeyState: Map<Phaser.Input.Keyboard.Key, number>;
    private keyStateToDirection: Map<number, Heading>;

    private flames: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    private fsm: StateMachine<Action>

    constructor(
        public driver: WyvernDriver,
        public scene: Phaser.Scene,
        size: keyof typeof sizeConfig = 'medium'
    ) {
        super(scene, 'WyvernController');
        
        scene.physics.add.existing(this.driver.sprite);
        this.wyvernBody = this.driver.sprite.body as Phaser.Physics.Arcade.Body;
        
        this.wyvernBody.setCircle(20, 108, 100);
        this.driver.sprite.setScale(sizeConfig[size].scale);
        this.topSpeed = sizeConfig[size].topSpeed;

        this.fsm = new StateMachine<Action>('Idle')
            .addTransition('Idle', 'Move')
            .addTransition('Idle', 'Dash')
            .addTransition('Idle', 'BreathAttack')

            .addTransition('Move', 'Idle')
            .addTransition('Move', 'Dash')
            .addTransition('Move', 'BreathAttack')

            .addTransition('Dash', 'Done')
            .addTransition('Done', 'Idle')
            .addTransition('BreathAttack', 'Interrupt_Breath')
            .addTransition('Interrupt_Breath', 'Idle')

            .respondTo('enter_Idle', () => {
                this.driver.setAnimation('Idle');
                this.setSpeedFraction(0);
            })
            .respondTo('enter_Move', () => {
                this.driver.setAnimation('Move');
                this.setSpeedFraction(1);
            })
            .respondTo('enter_Dash', () => {
                this.setSpeedFraction(0);
                this.driver.setAnimation('Dash');
                this.scene.tweens.add({
                    targets: this.driver.sprite,
                    // Make wyvern disappear then reappear at high speed.
                    alpha: { from: 1, to: 0 },
                    ease: 'Cubic.inOut',
                    duration: 250,
                    yoyo: true,
                    onYoyo: () => {
                        // On yoyo (halfway point), set high speed.
                        this.setSpeedFraction(8);
                    }
                })
                //this.scene.time.delayedCall(100, () => this.driver.setSpeedFraction(3), [], this);
                this.scene.time.delayedCall(500, () => this.fsm.send('Done'), [], this);
            })
            .respondTo('enter_BreathAttack', () => {
                this.setSpeedFraction(0);
                this.driver.setAnimation('BreathAttack');
                const breathPoint = {
                    x: this.driver.sprite.x + this.driver.getHeadingVector().x * 50 * this.driver.sprite.scale,
                    y: this.driver.sprite.y + this.driver.getHeadingVector().y * 50 * this.driver.sprite.scale
                };
                this.flames = this.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
                    frame: 'white',
                    color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
                    colorEase: 'quad.out',
                    lifespan: 1000 * this.driver.sprite.scale,
                    scale: {
                        start: 0.8 * this.driver.sprite.scale,
                        end: 0.1 * this.driver.sprite.scale,
                        ease: 'sine.out'
                    },
                    speed: 600 / (this.driver.sprite.scale + 1),
                    angle: this.driver.getHeadingConeAngleDegrees(),
                    advance: 200,
                    frequency: 20,
                    blendMode: 'ADD',
                    //duration: 1000,
                });
                this.flames.setDepth(1);
            })
            .respondTo('leave_BreathAttack', () => {
                if (this.flames) {
                    this.flames.stop();
                    this.flames = null;
                }
            })
            .respondTo('enter_Interrupt_Breath', () => {
                this.fsm.send('Idle');
            })
            .respondTo('enter_Done', () => {
                this.fsm.send('Idle');
            })
        ;

        if (!scene.input.keyboard) {
            throw new Error("WyvernController requires keyboard input");
        }

        scene.input.keyboard.on('keydown-PERIOD', () => { this.fsm.send('Dash'); });
        scene.input.keyboard.on('keydown-COMMA',  () => { this.fsm.send('BreathAttack'); });
        scene.input.keyboard.on('keyup-COMMA',    () => { this.fsm.send('Interrupt_Breath'); });

        this.headingKeyState = new Map<Phaser.Input.Keyboard.Key, number>([
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), 0x1],
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), 0x2],
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), 0x4],
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), 0x8]
        ]);
        this.keyStateToDirection = new Map([
            [0x1, 'N'],
            [0x3, 'NW'],
            [0x2, 'W'],
            [0x6, 'SW'],
            [0x4, 'S'],
            [0xC, 'SE'],
            [0x8, 'E'],
            [0x9, 'NE']
        ]);

        scene.add.existing(this);
        this.driver.sprite.postFX.addGlow(parseInt('#ffffff'.substring(1), 16), 2, 0.5, false, .1, 4);
    }

    private fly() {
        let key_state = 0;
        this.headingKeyState.forEach((bit, key) => {
            if (key.isDown) {
                key_state |= bit;
            }
        });

        const heading = this.keyStateToDirection.get(key_state);
        if (heading !== undefined && key_state > 0) {
            this.fsm.send('Move');
            if (this.fsm.getState() === 'Move') {
                this.driver.setHeading(heading);
            }
        } else {
            this.fsm.send('Idle');
        }
    }

    public preUpdate(time: number, delta: number): void {
        
        if (this.fsm.getState() === 'Move' || this.fsm.getState() === 'Idle') {
            this.fly();
        }
        
        this.wyvernBody.setVelocity(
            this.driver.getHeadingVector().x * this.currentSpeed,
            this.driver.getHeadingVector().y * this.currentSpeed
        );

        time + delta;
    }

}
