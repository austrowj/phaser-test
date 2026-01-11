import { Scene } from 'phaser';
import { createInputControlSystem } from '../game_objects/wyvernInputController';
import { Controls, createWyvernDriverSystem } from '../game_objects/wyvernDriver';
import { createWyvern } from '../game_objects/wyvern';
import { Dungeon } from '../game_objects/dungeon';

import * as ecs from 'bitecs';

import { Health, Killable } from '../systems/components';
import { checkForKill, kill } from '../systems/killCheck';
import { animateWyverns } from '../game_objects/animatedWyvern';
import { addEC, cleanup } from '../../util/initComponent';

export class Game extends Scene {
    private world: ecs.World;
    private systemUpdates: ((world: ecs.World, time: number, delta: number) => void)[] = [];
    private camera: Phaser.Cameras.Scene2D.Camera;

    private dungeon: Dungeon;

    constructor () { super('Game'); }

    create () {
        this.world = ecs.createWorld();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor('#a1a1a1');

        this.input.setDefaultCursor('url(assets/cursor.gif), pointer');

        this.dungeon = new Dungeon(this, 1024, 0);

        const playerAttacksGroup = this.physics.add.group();
        const playerGroup = this.physics.add.group();

        this.physics.add.collider(playerAttacksGroup, this.dungeon.monsters, (attackSprite, _) => {
            attackSprite.destroy();
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

        this.systemUpdates.push(createInputControlSystem(this.input.keyboard!));
        this.systemUpdates.push(createWyvernDriverSystem(this.world));
        this.systemUpdates.push(animateWyverns);
        this.systemUpdates.push(checkForKill);
        this.systemUpdates.push(kill);
        this.systemUpdates.push(cleanup);
        
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
