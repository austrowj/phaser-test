import { Scene } from 'phaser';
import { createInputControls } from '../game_objects/wyvernInputController';
import { WyvernDriver } from '../game_objects/wyvernDriver';
import { createWyvern, Wyvern } from '../game_objects/wyvern';
import { Dungeon } from '../game_objects/dungeon';

import * as ecs from 'bitecs';

import { Health, Killable } from '../systems/components';
import { checkForKill, kill } from '../systems/killCheck';
import { getWyvernAnimationSystem } from '../game_objects/animatedWyvern';

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

        this.systemUpdates.push(checkForKill);
        this.systemUpdates.push(kill);
        this.systemUpdates.push(getWyvernAnimationSystem(this.world));
        
        const wyverns = [
            createWyvern(
                this.world,
                playerGroup.create(512, 300, ''),
                new WyvernDriver(),
                playerAttacksGroup,
                'medium'
            )
        ];
        wyverns[0].sprite.setDepth(10);
        this.choosePlayer(wyverns[0]);
    }

    update(time: number, delta: number): void {
        super.update(time, delta);
        for (const sysUpdate of this.systemUpdates) {
            sysUpdate(this.world, time, delta);
        }
    }

    private player: Wyvern;

    private choosePlayer(obj: Wyvern) {
        if (this.player) {
            this.player.skillset.takeControls(); // Release previous controls.
            this.player.sprite.postFX.clear();
        }

        createInputControls(this.input.keyboard!, obj.skillset);
        obj.sprite.postFX.addGlow(parseInt('#000000'.substring(1), 16), 2, 0.5, false, .1, 4);
        this.camera.startFollow(obj.sprite);
        this.player = obj;
    }
}
