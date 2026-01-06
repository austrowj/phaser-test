const TILE_WIDTH = 32;
const TILE_HEIGHT = 16;

const floor_tile_indexes = [
    //0,
    1,2,3,4,5,8,9,10,11,12,13,
    //38
];

export class Dungeon {

    public monsters: Phaser.Physics.Arcade.Group;

    constructor(
        scene: Phaser.Scene, x: number, y: number
    ) {
        console.log('Creating dungeon at', x, y);

        const mapData = new Phaser.Tilemaps.MapData({
            tileWidth: TILE_WIDTH,
            tileHeight: TILE_HEIGHT,
            width: 60,
            height: 60,
            orientation: Phaser.Tilemaps.Orientation.ISOMETRIC
        });
        const map = new Phaser.Tilemaps.Tilemap(scene, mapData); // Apparently this adds the tilemap to the scene as a side effect.
        const tiles = map.addTilesetImage('floor_tiles')!;
        const layer = map.createBlankLayer('floor', tiles)!;
        layer.setPosition(x, y);
        for (var i = 0; i < 30; i++) {
            for (var j = 0; j < 60; j++) {
                // Notes: i=0 corresponds to "northwest" edge (using i <=> width and j <=> height).
                map.putTileAt(j == 0 ? 0 : floor_tile_indexes[Phaser.Math.Between(0, floor_tile_indexes.length - 1)], i, j, false, layer);
            }
        }

        this.monsters = scene.physics.add.group();
    }

    private createMonster(scene: Phaser.Scene, x: number, y: number) {
        const monsterIndexes = [
            8,  9, 10, 11, 12, 13, 14, 15,
            16, 17, 18, 19, 20, 21, 22, 23,
            24, 25,     27, 28, 29, 30, 31,
            32, 33, 34, 35, 36, 37,
        ]

        const sprite = this.monsters.create(x, y, 'monsters', Phaser.Utils.Array.GetRandom(monsterIndexes));
        sprite.setOrigin(0.5);
        sprite.body.setCircle(16);
        
        sprite.body.setVelocity(-100, 50);

        scene.time.delayedCall(9000, () => {
            scene.tweens.add({
                targets: sprite,
                alpha: { from: 1.0, to: 0.0 },
                duration: 1000,
                ease: 'Linear'
            });
            scene.time.delayedCall(1000, () => { sprite.destroy(); });
        });

        return sprite;
    }

    public createSpawner(scene: Phaser.Scene, x: number, y: number) {

        const sprite = scene.add.sprite(x, y, 'monsters', 26);
        sprite.setOrigin(0.5);
        sprite.setScale(1.44);

        scene.tweens.add({
            targets: sprite,
            alpha: { from: 0.8, to: 0.2 },
            yoyo: true,
            repeat: -1,
            duration: 1000 + Phaser.Math.Between(-100, 100),
            ease: 'Sine.easeInOut'
        });
        scene.tweens.add({
            targets: sprite,
            angle: 360,
            duration: 4000 + Phaser.Math.Between(-500, 500),
            ease: 'Linear',
            repeat: -1
        });
        scene.tweens.add({
            targets: sprite,
            y: y - 10,
            yoyo: true,
            repeat: -1,
            duration: 2000 + Phaser.Math.Between(-200, 200),
            ease: 'Sine.easeInOut'
        });
        sprite.postFX.addGlow(parseInt('#ff7300'.substring(1), 16), 2, 0.5, false, .1, 4);

        const spawnEvent = scene.time.addEvent({
            delay: 3000 + Phaser.Math.Between(-1000, 1000),
            loop: true,
            callback: () => {
                this.createMonster(scene, x, y);
            }
        });
        
        return { sprite, spawnEvent };
    }
}

export function load(scene: Phaser.Scene) {
    scene.load.spritesheet(
        'floor_tiles',
        'denzi_iso/img/96x96-32x32_dungeon_Denzi071009-1.PNG',
        { frameWidth: TILE_WIDTH, frameHeight: TILE_HEIGHT }
    );
    scene.load.spritesheet('monsters', '/denzi_iso/img/32x32_monsters_Denzi120117-1.png', { frameWidth: 32, frameHeight: 32 });
}
