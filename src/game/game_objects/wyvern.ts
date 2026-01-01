export enum Heading { W=0, NW, N, NE, E, SE, S, SW }
export enum Action { Hover=0, Fly, Sting, Breathe, Ram, Hit, Die }

const baseProperties = {
    topSpeed: 10,
}

const sizeConfig = {
    'small':  { scale: 0.25, rate: 18 },
    'medium': { scale: 0.50, rate: 12 },
    'large':  { scale: 1.00, rate:  8 }
}

const HEADING_VECTORS = new Map<Heading, Phaser.Math.Vector2>([
    [Heading.N,  new Phaser.Math.Vector2(0, -1)],
    [Heading.NE, new Phaser.Math.Vector2(1, -1).normalize()],
    [Heading.E,  new Phaser.Math.Vector2(1, 0)],
    [Heading.SE, new Phaser.Math.Vector2(1, 1).normalize()],
    [Heading.S,  new Phaser.Math.Vector2(0, 1)],
    [Heading.SW, new Phaser.Math.Vector2(-1, 1).normalize()],
    [Heading.W,  new Phaser.Math.Vector2(-1, 0)],
    [Heading.NW, new Phaser.Math.Vector2(-1, -1).normalize()]
]);

export class Wyvern extends Phaser.Physics.Arcade.Sprite {

    private currentHeading: Heading = Heading.S;
    private currentAction: Action = Action.Hover;
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

        switch (this.currentAction) {
            case Action.Fly: {
                const headingVector = HEADING_VECTORS.get(this.currentHeading);
                if (headingVector) {
                    this.setVelocity(
                        headingVector.x * this.topSpeed,
                        headingVector.y * this.topSpeed
                    );
                }
                break;
            }
            default: {
                this.setVelocity(0, 0);
                break;
            }
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
}