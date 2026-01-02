import { WyvernDriver, Heading, Behavior } from './wyvernDriver';

export class WyvernController extends Phaser.GameObjects.GameObject {

    private currentSpeed = 0;
    private topSpeed = 200;

    public setSpeedFraction(fraction: number) {
        this.currentSpeed = Math.min(this.topSpeed, fraction * this.topSpeed);
    }

    private headingKeyState: Map<Phaser.Input.Keyboard.Key, number>;
    private keyStateToDirection: Map<number, Heading>;

    private dashKey: Phaser.Input.Keyboard.Key;
    private dashAttack = {
        test: () => this.dashKey.isDown,
        cb: () => {
            this.setSpeedFraction(0);
            this.wyvern.currentBehavior = 'Ram';

            this.scene.tweens.add({
                targets: this.wyvern,
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
            //this.scene.time.delayedCall(100, () => this.wyvern.setSpeedFraction(3), [], this);
            this.scene.time.delayedCall(500, () => this.wyvern.currentBehavior = 'Hover', [], this);
        }
    }

    private breathKey: Phaser.Input.Keyboard.Key;
    private flames: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private breathAttack = {
        test: () => this.breathKey.isDown,
        cb: () => {
            this.setSpeedFraction(0);
            this.wyvern.currentBehavior = 'Breathe';
            const breathPoint = this.wyvern.getBreathHardpoint();
            this.flames = this.scene.add.particles(breathPoint.x, breathPoint.y, 'flares', {
                frame: 'white',
                color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
                colorEase: 'quad.out',
                lifespan: 500,
                scale: { start: 0.4, end: 0.1, ease: 'sine.out' },
                speed: 300,
                angle: this.wyvern.getHeadingConeAngleDegrees(),
                advance: 200,
                frequency: 20,
                blendMode: 'ADD',
                //duration: 1000,
            });
            this.flames.setDepth(1);
        }
    }

    private stateTransitions: Map<Behavior, { test: () => boolean; cb: () => void }[]> = new Map([
        ['Hover', [
            this.dashAttack,
            this.breathAttack,
            { test: () => true, cb: () => this.fly() }
        ]],
        ['Fly', [
            this.dashAttack,
            this.breathAttack,
            { test: () => true, cb: () => this.fly() }
        ]],
        ['Ram', []],
        ['Breathe', [
            {
                test: () => !this.breathKey.isDown,
                cb: () => {
                    this.wyvern.currentBehavior = 'Hover';
                    if (this.flames) {
                        this.flames.stop();
                        this.flames = null;
                    }
                }
            }
        ]]
    ])

    constructor(
        public wyvern: WyvernDriver,
        public scene: Phaser.Scene
    ) {
        super(scene, 'WyvernController');

        if (!scene.input.keyboard) {
            throw new Error("WyvernController requires keyboard input");
        }

        this.dashKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
        this.breathKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA);

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

        this.setInteractive();
        //wyvern.postFX.addGlow(parseInt('#ffffff'.substring(1), 16), 2, 0.5, false, .1, 4);
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
            this.wyvern.currentHeading = heading;
            this.wyvern.currentBehavior = 'Fly';
            this.setSpeedFraction(1);
        } else {
            this.wyvern.currentBehavior = 'Hover';
            this.setSpeedFraction(0);
        }
    }

    public preUpdate(time: number, delta: number): void {

        const attempted_transitions = this.stateTransitions.get(this.wyvern.currentBehavior)?.filter(transition => transition.test());
        if (attempted_transitions && attempted_transitions.length > 0) {
            // Only do the first valid transition.
            const transition = attempted_transitions[0];
            transition.cb();
        }

        time + delta;
    }

}
