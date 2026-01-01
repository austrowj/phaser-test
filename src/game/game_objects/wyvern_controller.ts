import { Wyvern, Heading, Action } from '../game_objects/wyvern';

export class WyvernController extends Phaser.GameObjects.GameObject {

    private heading_key_state: Map<Phaser.Input.Keyboard.Key, number>;
    private key_state_to_direction: Map<number, Heading>;

    constructor(
        public wyvern: Wyvern,
        public scene: Phaser.Scene
    ) {
        super(scene, 'WyvernController');

        if (!scene.input.keyboard) {
            throw new Error("WyvernController requires keyboard input");
        }

        this.heading_key_state = new Map<Phaser.Input.Keyboard.Key, number>([
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), 0x1],
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), 0x2],
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), 0x4],
            [scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), 0x8]
        ]);
        this.key_state_to_direction = new Map([
            [0x1, Heading.N],
            [0x3, Heading.NW],
            [0x2, Heading.W],
            [0x6, Heading.SW],
            [0x4, Heading.S],
            [0xC, Heading.SE],
            [0x8, Heading.E],
            [0x9, Heading.NE]
        ]);

        this.setInteractive();
        wyvern.postFX.addGlow(parseInt('#ff9900'.substring(1), 16), 1.5, 0.5);
    }

    preUpdate(time: number, delta: number): void {
        let key_state = 0;
        this.heading_key_state.forEach((bit, key) => {
            if (key.isDown) {
                key_state |= bit;
            }
        });
        const heading = this.key_state_to_direction.get(key_state);
        if (heading !== undefined) {
            this.wyvern.setHeading(heading);
            this.wyvern.setAction(Action.Fly);
        } else {
            this.wyvern.setAction(Action.Hover);
        }
    }

}