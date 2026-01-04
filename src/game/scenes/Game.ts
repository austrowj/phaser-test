import { Scene } from 'phaser';
import { createInputControls } from '../game_objects/wyvernInputController';
import { Controls, WyvernSkillset } from '../game_objects/wyvernSkillset';
import { WyvernAnimationDriver } from '../game_objects/wyvernAnimationDriver';
import { createWyvern } from '../game_objects/wyvern';
import { Dungeon } from '../game_objects/dungeon';
import { Communicator } from '../../util/communicator';

export class Game extends Scene
{
    private camera: Phaser.Cameras.Scene2D.Camera;
    //background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;

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

        new Dungeon(this, 512, 200);

        this.controlBridge = createInputControls(this.input.keyboard!);
        const wyverns = [
            createWyvern(
                this.physics.add.sprite(512, 384, ''),
                new WyvernAnimationDriver('air'),
                new WyvernSkillset(),
                'medium'
            ),
            createWyvern(
                this.physics.add.sprite(700, 500, ''),
                new WyvernAnimationDriver('water'),
                new WyvernSkillset(),
                'large'
            ),
            createWyvern(
                this.physics.add.sprite(300, 200, ''),
                new WyvernAnimationDriver('fire'),
                new WyvernSkillset(),
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
        });
    }

    private controlBridge: Communicator<Controls>;

    private player: ReturnType<typeof createWyvern> | null = null;

    private choosePlayer(obj: ReturnType<typeof createWyvern>) {
        if (this.player) {
            this.player.sprite.postFX.clear();
        }
        this.controlBridge.removeListeners();
        this.msg_text.removeFromDisplayList();

        obj.skillset.listenTo(this.controlBridge);
        obj.sprite.postFX.addGlow(parseInt('#ffffff'.substring(1), 16), 2, 0.5, false, .1, 4);
        this.camera.startFollow(obj.sprite);
        this.player = obj;
    }
}
