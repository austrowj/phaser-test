import * as ecs from 'bitecs';
import { createInputControlSystem } from '../game_objects/wyvernInputController';
import { createWyvernDriverSystem } from '../game_objects/wyvernDriver';
import { syncWyvernAnimation } from '../game_objects/animatedWyvern';
import { checkForKill, kill } from './killCheck';
//import { cleanup } from '../../util/initComponent';

export function createAllSystems(scene: Phaser.Scene) {
    const world = ecs.createWorld();

    const systemUpdates = [] as ((world: ecs.World, time: number, delta: number) => void)[];
    systemUpdates.push(createInputControlSystem(scene.input.keyboard!));
    systemUpdates.push(createWyvernDriverSystem(world));
    systemUpdates.push(syncWyvernAnimation);
    systemUpdates.push(checkForKill);
    systemUpdates.push(kill);
    //systemUpdates.push(cleanup);
    return { world, systemUpdates };
}