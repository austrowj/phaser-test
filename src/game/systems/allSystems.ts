import * as ecs from 'bitecs';
import { createInputControlSystem as inputControlSystem } from '../game_objects/wyvernInputController';
import { createWyvernDriverSystem as wyvernDriverSystem } from '../game_objects/wyvernDriver';
import { syncWyvernAnimation } from '../game_objects/animatedWyvern';
import { SpriteManager } from './spriteManager';
import { updateVitality } from './damageSystem';
import { cleanupEntities } from './cleanupSystem';

export function createAllSystems(scene: Phaser.Scene) {
    const world = ecs.createWorld();
    const spriteManager = new SpriteManager(scene, world);
    return { world, systems: [
        () => spriteManager.createSprites(),
        inputControlSystem(scene.input.keyboard!),
        wyvernDriverSystem(world),
        syncWyvernAnimation,
        updateVitality,
        cleanupEntities,
    ]};
}