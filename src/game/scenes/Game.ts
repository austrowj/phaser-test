import { Scene } from 'phaser';
import { connectInputControls } from '../game_objects/wyvernInputController';
import { WyvernSkillset } from '../game_objects/wyvernSkillset';
import { WyvernAnimationDriver } from '../game_objects/wyvernAnimationDriver';
import { createWyvern } from '../game_objects/wyvern';
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

        new Dungeon(this, 512, 200);

        const playerSprite = this.physics.add.sprite(512, 384, '')
        this.camera.startFollow(playerSprite);
        createWyvern(
            playerSprite,
            new WyvernAnimationDriver('earth'),
            new WyvernSkillset(),
            'medium',
            connectInputControls(this.input.keyboard!)
        );

        createWyvern(
            this.physics.add.sprite(700, 500, ''),
            new WyvernAnimationDriver('water'),
            new WyvernSkillset(),
            'large'
        );
        
        createWyvern(
            this.physics.add.sprite(300, 200, ''),
            new WyvernAnimationDriver('fire'),
            new WyvernSkillset(),
            'small'
        );

    }
}
