import * as ecs from 'bitecs';
import { createInputControlSystem } from '../game_objects/wyvernInputController';
import { createWyvernDriverSystem } from '../game_objects/wyvernDriver';
import { syncWyvernAnimation } from '../game_objects/animatedWyvern';
import { checkForKill, kill } from './killCheck';
import { SpriteManager } from './spriteManager';

export function createAllSystems(scene: Phaser.Scene) {
    const world = ecs.createWorld();
    const spriteManager = new SpriteManager(scene, world);
    return { world, systems: [
        createInputControlSystem(scene.input.keyboard!),
        createWyvernDriverSystem(world),
        syncWyvernAnimation,
        checkForKill,
        kill,
        () => spriteManager.createSprites(),
    ]};
}