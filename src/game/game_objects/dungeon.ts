export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 16;

const floor_tile_indexes = [
    //0,
    1,2,3,4,5,8,9,10,11,12,13,
    //38
];

export class Dungeon {

    constructor(
        scene: Phaser.Scene, x: number, y: number
    ) {
        console.log('Creating dungeon at', x, y);

        const mapData = new Phaser.Tilemaps.MapData({
            tileWidth: TILE_WIDTH,
            tileHeight: TILE_HEIGHT,
            width: 30,
            height: 30,
            orientation: Phaser.Tilemaps.Orientation.ISOMETRIC
        });
        const map = new Phaser.Tilemaps.Tilemap(scene, mapData); // Apparently this adds the tilemap to the scene as a side effect.
        const tiles = map.addTilesetImage('floor_tiles')!;
        const layer = map.createBlankLayer('floor', tiles)!;
        layer.setPosition(x, y);
        for (var i = 0; i < 30; i++) {
            for (var j = 0; j < 30; j++) {
                // Notes: i=0 corresponds to "northeast" edge.
                map.putTileAt(i == 0 ? 0 : floor_tile_indexes[Phaser.Math.Between(0, floor_tile_indexes.length - 1)], j, i, false, layer);
            }
        }
    }
}