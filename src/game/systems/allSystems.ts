import * as ecs from 'bitecs';
import { createInputControlSystem } from '../game_objects/wyvernInputController';
import { createWyvernDriverSystem } from '../game_objects/wyvernDriver';
import { syncWyvernAnimation } from '../game_objects/animatedWyvern';
import { checkForKill, kill } from './killCheck';
//import { cleanup } from '../../util/initComponent';

export function createAllSystems(scene: Phaser.Scene) {
    const world = ecs.createWorld();
    return { world, systems: [
        createInputControlSystem(scene.input.keyboard!),
        createWyvernDriverSystem(world),
        syncWyvernAnimation,
        checkForKill,
        kill,
    ]};
}