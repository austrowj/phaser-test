
export enum Heading { W=0, NW, N, NE, E, SE, S, SW }
export enum Action { Hover=0, Fly, Sting, Breathe, Ram, Hit, Die }

export class Wyvern extends Phaser.Physics.Arcade.Sprite {

    private currentHeading: Heading = Heading.N;
    private currentAction: Action = Action.Fly;

    constructor(scene: Phaser.Scene, x: number, y: number, variant?: 'air' | 'fire' | 'water') {
        const textureKey = variant ? 'wyvern_' + variant : 'wyvern';
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        for (let action in Action) {
            for (let dir in Heading) {
                this.anims.create({
                    key: action + '_' + dir,
                    frames: this.anims.generateFrameNumbers(textureKey, {
                        start: Number(dir)*8*7 + Number(action)*8,
                        end:   Number(dir)*8*7 + Number(action)*8 + 7 
                    }),
                    frameRate: (action === 'Hover') ? 6 : 12,
                    repeat: -1
                });
            }
        }
        this.play(this.currentAction + '_' + this.currentHeading);
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