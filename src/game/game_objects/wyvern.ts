export enum Heading { W=0, NW, N, NE, E, SE, S, SW };
export enum Action { Hover=0, Fly, Sting, Breathe, Ram, Hit, Die };

const baseProperties = {
    topSpeed: 10,
}

const sizeConfig = {
    'small':  { scale: 0.25, rate: 18 },
    'medium': { scale: 0.50, rate: 12 },
    'large':  { scale: 1.00, rate:  8 }
}

const HEADING_VECTORS = new Map<Heading, Phaser.Math.Vector2>([
    [Heading.N,  new Phaser.Math.Vector2(0, -1).normalize()],
    [Heading.NE, new Phaser.Math.Vector2(2, -1).normalize()],
    [Heading.E,  new Phaser.Math.Vector2(1,  0).normalize()],
    [Heading.SE, new Phaser.Math.Vector2(2,  1).normalize()],
    [Heading.S,  new Phaser.Math.Vector2(0,  1).normalize()],
    [Heading.SW, new Phaser.Math.Vector2(-2, 1).normalize()],
    [Heading.W,  new Phaser.Math.Vector2(-1, 0).normalize()],
    [Heading.NW, new Phaser.Math.Vector2(-2, -1).normalize()]
]);

export class Wyvern extends Phaser.Physics.Arcade.Sprite {

    public currentHeading: Heading = Heading.S;
    public currentAction: Action = Action.Hover;
    public speed: number = 0;

    private topSpeed: number;

    constructor(
        scene: Phaser.Scene, x: number, y: number,
        variant?: 'air' | 'fire' | 'water',
        size: keyof typeof sizeConfig = 'medium'
    ) {
        const textureKey = variant ? 'wyvern_' + variant : 'wyvern';
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCircle(20, 108, 100);
        this.setScale(sizeConfig[size].scale);

        this.topSpeed = baseProperties.topSpeed * sizeConfig[size].rate;

        for (let action in Action) {
            for (let dir in Heading) {
                this.anims.create({
                    key: action + '_' + dir,
                    frames: this.anims.generateFrameNumbers(textureKey, {
                        start: Number(dir)*8*7 + Number(action)*8,
                        end:   Number(dir)*8*7 + Number(action)*8 + 7 
                    }),
                    frameRate: sizeConfig[size].rate,
                    repeat: -1
                });
            }
        }
        this.play(this.currentAction + '_' + this.currentHeading);
    }

    public preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        const headingVector = HEADING_VECTORS.get(this.currentHeading);
        if (headingVector) {
            this.setVelocity(
                headingVector.x * this.speed,
                headingVector.y * this.speed
            );
        }
    }

    public setHeading(heading: Heading) {
        this.currentHeading = heading;
        this.play(this.currentAction + '_' + this.currentHeading, true);
    }

    public setAction(action: Action) {
        this.currentAction = action;
        this.play(this.currentAction + '_' + this.currentHeading, true);
    }

    public setSpeedFraction(fraction: number) {
        this.speed = Phaser.Math.Clamp(fraction, 0, 10) * this.topSpeed;
    }

    public getBreathHardpoint(): Phaser.Math.Vector2 {
        //  Hardpoint is roughly in front of the wyvern's mouth.
        const headingVector = HEADING_VECTORS.get(this.currentHeading);
        if (headingVector) {
            return new Phaser.Math.Vector2(
                this.x + headingVector.x * 30,
                this.y + headingVector.y * 30
            );
        } else {
            return new Phaser.Math.Vector2(this.x, this.y);
        }
    }

    public getHeadingConeAngleDegrees(): {min: number, max: number} {
        const headingVector = HEADING_VECTORS.get(this.currentHeading);
        if (headingVector) {
            const base = Phaser.Math.RadToDeg(Math.atan2(headingVector.y, headingVector.x));
            return {min: base - 20, max: base + 20};
        } else {
            return {min: 0, max: 0};
        }
    }
}