import { Scene } from 'phaser';
import { load as loadDungeon } from '../game_objects/dungeon';
import { load as loadWyverns } from '../game_objects/animatedWyvern';
import * as spriteMaps from '../data/spritesheetMaps';

export class Preloader extends Scene {
    constructor () { super('Preloader'); }

    init () {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload () {
        this.load.setBaseURL('./');
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        
        loadWyverns(this);
        loadDungeon(this);

        this.load.atlas('flares', 'effects/flares.png', 'effects/flares.json');

        this.load.spritesheet(
            'mouse_cursor',
            'denzi_iso/img/32x32_mouse_pointer_Denzi040418.gif',
            { frameWidth: 32, frameHeight: 32 }
        );

        Object.entries(spriteMaps).forEach(([key, map]) => {
            this.load.spritesheet(key, map.path, map.frameDimensions);
        });
    }

    create () {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('Game');
    }
}
