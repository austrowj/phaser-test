import * as ecs from 'bitecs';

export const CollisionGroup = {};

export class CollisionManager {
    constructor(private scene: Phaser.Scene, private world: ecs.World) {}
}