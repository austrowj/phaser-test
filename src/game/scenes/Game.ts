import { Scene } from 'phaser';
import { Wyvern } from '../game_objects/wyvern';
import { WyvernController } from '../game_objects/wyvern_controller';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    //background: Phaser.GameObjects.Image;
    //msg_text : Phaser.GameObjects.Text;

    player: Phaser.GameObjects.GameObject;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor('#a1a1a1ff');

        /*
        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.msg_text = this.add.text(512, 384, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.msg_text.setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('GameOver');

        });
        */

        this.player = new WyvernController(new Wyvern(this, 512, 384), this);
        this.add.existing(this.player);
    }
}
