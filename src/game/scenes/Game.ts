import { Scene } from 'phaser';
import { WyvernController } from '../game_objects/wyvernController';
import { WyvernDriver } from '../game_objects/wyvernDriver';
import { Dungeon } from '../game_objects/dungeon';

export class Game extends Scene
{
    private camera: Phaser.Cameras.Scene2D.Camera;
    //background: Phaser.GameObjects.Image;
    //msg_text : Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor('#a1a1a1');

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

        this.add.existing(new Dungeon(this, 512, 200));

        const player = new WyvernDriver(this.add.sprite(512, 384, ''), 'air');
        new WyvernController(new WyvernDriver(this.add.sprite(300, 200, ''), 'fire'), this, 'small');
        new WyvernController(new WyvernDriver(this.add.sprite(700, 500, ''), 'water'), this, 'large');

        this.camera.startFollow(player.sprite);
        new WyvernController(player, this);
    }
}
