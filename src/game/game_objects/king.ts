import { monsters4 } from '../data/spritesheetMaps';
import { Step, xy } from '../world/parameters';
import { fadeOutAndDestroy } from './effects';

export function createKing(scene: Phaser.Scene, x: number, y: number, physicsGroup?: Phaser.Physics.Arcade.Group) {

    const sprite = scene.add.sprite(x, y, 'monsters4', monsters4.indexOf.KingArthur);
    sprite.setCrop(1, 0, sprite.width - 2, sprite.height);

    if (physicsGroup) {
        physicsGroup.add(sprite);
        (sprite.body as Phaser.Physics.Arcade.Body)
            .setCircle(16)
            .setVelocity(...xy('SW', 2*Step))
        ;
    }
    
    scene.time.delayedCall(18000, () => {
        fadeOutAndDestroy(scene, sprite, 2000);
    });

    return sprite;
}