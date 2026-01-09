import { monsters4 } from '../data/spritesheetMaps';
import { xy, Step } from '../world/parameters';
import { fadeOutAndDestroy } from './effects';

export function createBagOfCoins(scene: Phaser.Scene, x: number, y: number, physicsGroup?: Phaser.Physics.Arcade.Group) {

    const sprite = scene.add.sprite(x, y, 'monsters4', monsters4.indexOf.LargeCoinBag);
    sprite.setOrigin(0.5);
    sprite.setCrop(1, 0, sprite.width - 2, sprite.height);

    if (physicsGroup) {
        physicsGroup.add(sprite);
        (sprite.body as Phaser.Physics.Arcade.Body)
            .setCircle(16)
            .setVelocity(...xy('SW', 2*Step))
        ;
    }

    // slight bounce
    /*
    scene.time.delayedCall(Phaser.Math.Between(0, 500), () => {
        scene.tweens.add({
            targets: sprite,
            y: -4,
            yoyo: false,
            repeat: -1,
            duration: 1000,
            ease: 'Bounce.in'
        });
    });*/

    scene.time.delayedCall(18000, () => {
        fadeOutAndDestroy(scene, sprite, 2000);
    });

    return sprite;
}