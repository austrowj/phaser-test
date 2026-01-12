import { Scene } from 'phaser';
import { Controls } from '../game_objects/wyvernDriver';
import { createWyvern } from '../game_objects/wyvern';
import { Dungeon } from '../game_objects/dungeon';

import * as ecs from 'bitecs';

import { Health, Killable } from '../systems/components';
import { addEC } from '../../util/initComponent';
import { createAllSystems } from '../systems/allSystems';

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

        this.input.setDefaultCursor('url(assets/cursor.gif), pointer');

        this.dungeon = new Dungeon(this, 1024, 0);

        const playerAttacksGroup = this.physics.add.group();
        const playerGroup = this.physics.add.group();

        this.physics.add.collider(playerAttacksGroup, this.dungeon.monsters, (attackSprite, monsterSprite) => {
            const attackBody = (attackSprite as Phaser.GameObjects.Sprite).body as Phaser.Physics.Arcade.Body;
            const monsterBody = (monsterSprite as Phaser.GameObjects.Sprite).body as Phaser.Physics.Arcade.Body;
            if (monsterBody instanceof Phaser.Physics.Arcade.Body) {
                monsterBody.velocity.add(
                    new Phaser.Math.Vector2().copy(monsterBody.center).subtract(attackBody.center).normalize().scale(200)
                )
            }
            attackSprite.destroy();
            //console.log((attackSprite as Phaser.GameObjects.Sprite).data.get('originator')); // it just works
        });

        const player = ecs.addEntity(this.world)
        ecs.addComponents(this.world, player, Health, Killable);
        Health.current[player] = 10;
        Health.max[player] = 100;
        Health.rate[player] = -1;
        Killable.shouldDie[player] = false;

        //this.dungeon.createSpawner(this, 1024, 0, 6000);
        this.dungeon.createSpawner(this, 1236, 106, 10000, this.dungeon.createPack);
        this.dungeon.createSpawner(this, 1448, 212, 6000);
        
        const wyverns = [
            createWyvern(
                this.world,
                playerGroup.create(512, 300, ''),
                playerAttacksGroup,
                'medium'
            )
        ];
        wyverns[0].sprite.setDepth(10);
        addEC(this.world, wyverns[0].eid, Controls, {
            steer: undefined,
            dash: false,
            wingBlast: false,
            breathe: false,
        });

        const obj = wyverns[0];
        obj.sprite.postFX.addGlow(parseInt('#000000'.substring(1), 16), 2, 0.5, false, .1, 4);
        this.camera.startFollow(obj.sprite);
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        for (const sysUpdate of this.systemUpdates) {
            sysUpdate(this.world, time, delta);
        }
    }
}
