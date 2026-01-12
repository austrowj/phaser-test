import * as ecs from 'bitecs';

export const Sprite = [] as Phaser.GameObjects.Sprite[];

class SpriteManager {
    constructor(private scene: Phaser.Scene, private world: ecs.World) {}
}