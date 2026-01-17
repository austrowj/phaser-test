import { Step, xy } from "../world/parameters";
import { createKing } from "./king";
import { createDwarf } from "./dwarf";

import * as ecs from 'bitecs';
import { EntityBuilder } from "../../util/entityBuilder";
import { SpriteConfig, WhenSpriteCreated } from "../systems/spriteManager";
import { Loot } from "../systems/lootSystem";
import { Vitality } from "../systems/damageSystem";
import { flagForCleanup } from "../systems/cleanupSystem";

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
        private world: ecs.World,
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

    private createMonster(x: number, y: number, config?: {index: number, sheet: string} ) {
        const monsterIndexes = [
            8,  9, 10, 11, 12, 13, 14, 15,
            16, 17, 18, 19, 20, 21, 22, 23,
            24, 25,     27, 28, 29, 30, 31,
            32, 33, 34, 35, 36, 37,
        ]

        return new EntityBuilder(this.world)
            .addSoA(Loot, {})
            .addSoA(Vitality, {current: 100, max: 100, min: 0})
            .addAoS(SpriteConfig, {
                x: x,
                y: y,
                textureKey: config ? config.sheet : 'monsters0',
                frame: config ? config.index : Phaser.Utils.Array.GetRandom(monsterIndexes),
                origin: [0.5, 0.5],
                scale: 1.25,
                depth: 1,
            })
            .createRelated(WhenSpriteCreated, (sprite: Phaser.GameObjects.Sprite) => {
                this.monsters.add(sprite);
                const body = sprite.body as Phaser.Physics.Arcade.Body;
                body.setCircle(16);
                body.setVelocity(-50, 25);
                flagForCleanup(this.world, sprite.data.get('eid'), 20000, false);
            });
    }

    public createSpawner(scene: Phaser.Scene, x: number, y: number, delay?: number, spawncb?: (scene: Phaser.Scene, x: number, y: number) => void) {

        const sprite = scene.add.sprite(x, y, 'monsters0', 26);
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

        const myDelay = delay !== undefined ? delay : 3000;
        const myCb = spawncb !== undefined ? () => spawncb!(scene, x, y) : () => this.createMonster(x, y);

        const spawnEvent = scene.time.addEvent({
            delay: myDelay + Phaser.Math.Between(-myDelay/3, myDelay/3),
            loop: true,
            callback: myCb
        });

        myCb();
        
        return { sprite, spawnEvent };
    }

    public createPack = (_: Phaser.Scene, x: number, y: number) => {
        createKing(this.world, x, y, this.monsters);

        const bagPositions = [
            xy('NE', 2*Step, [x, y]),
            xy('NE', 4*Step, [x, y]),
            xy('NE', 6*Step, [x, y]),
        ];

        bagPositions.forEach((pos) => {
            //createBagOfCoins(scene, ...pos, this.monsters);
            createDwarf(this.world, ...xy('NW', 1*Step, pos), this.monsters);
            createDwarf(this.world, ...xy('SE', 1*Step, pos), this.monsters);
        });
    }
}

export function load(scene: Phaser.Scene) {
    scene.load.spritesheet(
        'floor_tiles',
        'denzi_iso/img/96x96-32x32_dungeon_Denzi071009-1.PNG',
        { frameWidth: TILE_WIDTH, frameHeight: TILE_HEIGHT }
    );
}
