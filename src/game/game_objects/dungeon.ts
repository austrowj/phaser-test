export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 16;

const floor_tile_indexes = [0, 1,2,3,4,5,8,9,10,11,12,13, 38];

export class Dungeon extends Phaser.Physics.Arcade.Sprite {

    constructor(
        scene: Phaser.Scene, x: number, y: number
    ) {
        super(scene, x, y, 'floor_tiles');
        scene.add.existing(this);
        console.log('Creating dungeon at', x, y);

        for (let i = 0; i < 30; i++) {
            for (let j = 0; j < 30; j++) {
                if ( Phaser.Math.Between(0, 4) != 0) continue;

                const tileIndex = floor_tile_indexes[
                    Phaser.Math.Between(0, floor_tile_indexes.length - 1)
                ];
                scene.add.sprite(
                    x + i * TILE_WIDTH / 2 - j * TILE_WIDTH / 2,
                    y + i * TILE_HEIGHT / 2 + j * TILE_HEIGHT / 2,
                    'floor_tiles',
                    tileIndex
                );
            }
        }
    }
}