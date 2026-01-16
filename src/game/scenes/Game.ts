import { Scene } from 'phaser';
import { Controls } from '../game_objects/wyvernDriver';
import { createWyvern } from '../game_objects/wyvern';
import { Dungeon } from '../game_objects/dungeon';

import * as ecs from 'bitecs';

import { createAllSystems } from '../systems/allSystems';
import { WhenSpriteCreated } from '../systems/spriteManager';
import { EntityBuilder } from '../../util/entityBuilder';
import { flagForCleanup } from '../systems/cleanupSystem';
import { Damaging } from '../systems/damageSystem';

export class Game extends Scene {

    private world: ecs.World;
    private systemUpdates: ((world: ecs.World, time: number, delta: number) => void)[] = [];
    private camera: Phaser.Cameras.Scene2D.Camera;

    private dungeon: Dungeon;

    constructor () { super('Game'); }

    create () {
        const { world, systems } = createAllSystems(this);
        this.world = world;
        this.systemUpdates = systems;
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor('#a1a1a1');
        this.camera.setBounds(-100, -100, 1800, 1500);

        this.input.setDefaultCursor('url(assets/cursor.gif), pointer');

        this.dungeon = new Dungeon(this.world, this, 1024, 0);

        const playerAttacksGroup = this.physics.add.group();
        //const playerGroup = this.physics.add.group();

        this.physics.add.overlap(playerAttacksGroup, this.dungeon.monsters, (attackSprite, monsterSprite) => {
            const sprite = attackSprite as Phaser.GameObjects.Sprite;
            const monster = monsterSprite as Phaser.GameObjects.Sprite;

            if (monster.data) {
                const targetEID = monster.data.get('eid');
                if (targetEID) {
                    new EntityBuilder(this.world, targetEID).createRelated(Damaging, {amount: 1});
                }
            }

            const attackBody = sprite.body as Phaser.Physics.Arcade.Body;
            const monsterBody = (monsterSprite as Phaser.GameObjects.Sprite).body as Phaser.Physics.Arcade.Body;
            if (monsterBody instanceof Phaser.Physics.Arcade.Body) {
                monsterBody.velocity.add(
                    new Phaser.Math.Vector2().copy(monsterBody.center).subtract(attackBody.center).normalize().scale(20)
                )
            }
            flagForCleanup(this.world, sprite.data.get('eid'));
        });

        this.dungeon.createSpawner(this, 1024, 0, 6000);
        this.dungeon.createSpawner(this, 1236, 106, 10000, this.dungeon.createPack);
        this.dungeon.createSpawner(this, 1448, 212, 6000);
        
        createWyvern(
            this.world,
            { x: 512, y: 300, },// group: playerGroup },
            playerAttacksGroup,
            'medium'
        )
        .addSoA(Controls, {
            steer: undefined,
            dash: false,
            wingBlast: false,
            breathe: false,
        })
        .createRelated(WhenSpriteCreated, (sprite: Phaser.GameObjects.Sprite) => { // argument type isn't getting inferred TODO: fix
            this.camera.startFollow(sprite);
            sprite.postFX.addGlow(parseInt('#000000'.substring(1), 16), 2, 0.5, false, .1, 4);
            (sprite.body as Phaser.Physics.Arcade.Body).setBoundsRectangle(new Phaser.Geom.Rectangle(-100, -100, 1800, 1500));
            (sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
        });
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        for (const sysUpdate of this.systemUpdates) {
            sysUpdate(this.world, time, delta);
        }
    }
}
