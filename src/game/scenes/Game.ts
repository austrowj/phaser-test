import { Scene } from 'phaser';
import { createInputControls } from '../game_objects/wyvernInputController';
import { WyvernBasicSkillset } from '../game_objects/wyvernBasicSkillset';
import { WyvernAnimationDriver } from '../game_objects/wyvernAnimationDriver';
import { createWyvern, Wyvern } from '../game_objects/wyvern';
import { Dungeon } from '../game_objects/dungeon';

export class Game extends Scene
{
    private camera: Phaser.Cameras.Scene2D.Camera;
    //background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;

    private dungeon: Dungeon;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor('#a1a1a1');

        this.input.setDefaultCursor('url(assets/cursor.gif), pointer');

        /*
        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);
        */
        this.msg_text = this.add.text(512, 600, 'CHOOSE YOUR FIGHTER', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.msg_text.setOrigin(0.5);
        this.msg_text.setDepth(10);

        this.dungeon = new Dungeon(this, 1024, 0);

        const playerAttacksGroup = this.physics.add.group();
        this.physics.add.collider(playerAttacksGroup, this.dungeon.monsters, (attackSprite, monsterSprite) => { });

        const wyverns = [
            createWyvern(
                this.physics.add.sprite(512, 300, ''), // Sprite key will be overridden by animation driver.
                new WyvernAnimationDriver('air'),
                new WyvernBasicSkillset(),
                playerAttacksGroup,
                'medium'
            ),
            createWyvern(
                this.physics.add.sprite(712, 500, ''),
                new WyvernAnimationDriver('water'),
                new WyvernBasicSkillset(),
                playerAttacksGroup,
                'large'
            ),
            createWyvern(
                this.physics.add.sprite(312, 500, ''),
                new WyvernAnimationDriver('fire'),
                new WyvernBasicSkillset(),
                playerAttacksGroup,
                'small'
            ),
        ];

        wyverns.forEach((wyvern, _) => {
            wyvern.sprite.setInteractive();
            wyvern.sprite.on('pointerdown', () => {
                if (this.player !== wyvern) {
                    wyvern.sprite.postFX.clear();
                    this.choosePlayer(wyvern);
                }
            });
            wyvern.sprite.on('pointerover', () => {
                if (this.player !== wyvern) {
                    wyvern.sprite.postFX.addGlow(parseInt('#09ff00'.substring(1), 16), 4, 0.5, false, .1, 4);
                }
            });
            wyvern.sprite.on('pointerout', () => {
                if (this.player !== wyvern) {
                    wyvern.sprite.postFX.clear();
                }
            });
            wyvern.sprite.setDepth(10);
        });

        this.dungeon.createSpawner(this, 1024, 0);
        this.dungeon.createSpawner(this, 1236, 106);
        this.dungeon.createSpawner(this, 1448, 212);
    }

    private player: Wyvern;

    private choosePlayer(obj: Wyvern) {
        if (this.player) {
            this.player.skillset.takeControls(); // Release previous controls.
            this.player.sprite.postFX.clear();
        }
        this.msg_text.removeFromDisplayList();

        this.physics.add.collider(obj.sprite, this.dungeon.monsters);
        createInputControls(this.input.keyboard!, obj.skillset);
        obj.sprite.postFX.addGlow(parseInt('#ffffff'.substring(1), 16), 2, 0.5, false, .1, 4);
        this.camera.startFollow(obj.sprite);
        this.player = obj;
    }
}
