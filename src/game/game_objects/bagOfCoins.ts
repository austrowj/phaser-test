import { monsters4 } from '../data/spritesheetMaps';
import { xy, Step } from '../world/parameters';
import { fadeOutAndDestroy } from './effects';

export function createBagOfCoins(scene: Phaser.Scene, x: number, y: number) {

    const container = scene.add.container(x, y);

    const sprite = scene.physics.add.sprite(0, 0, 'monsters4', monsters4.indexOf.LargeCoinBag);
    container.add(sprite);
    sprite.setOrigin(0.5, 1);
    sprite.setCrop(1, 0, sprite.width - 2, sprite.height);

    //scene.physics.add.existing(physicsSprite);
    (sprite.body as Phaser.Physics.Arcade.Body)
        .setCircle(16)
        .setVelocity(...xy('SW', 2*Step))
    ;

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
        fadeOutAndDestroy(scene, container, 2000);
    });

    return container;
}