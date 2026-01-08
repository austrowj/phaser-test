import { monsters1 } from "../data/spritesheetMaps";
import { Step, xy } from "../world/parameters";
import { fadeOutAndDestroy } from "./effects";

export function createDwarf(scene: Phaser.Scene, x: number, y: number) {

    const container = scene.add.container(x, y);
    const sprite = scene.add.sprite(0, 0, 'monsters1', monsters1.indexOf.Dwarf);
    container.add(sprite);
    sprite.setOrigin(0.5, 1);
    sprite.flipX = true;

    scene.physics.add.existing(container);
    (container.body as Phaser.Physics.Arcade.Body)
        .setCircle(16)
        .setVelocity(...xy('SW', 2*Step))
    ;

    scene.time.delayedCall(Phaser.Math.Between(0, 500), () => {
        scene.tweens.add({
            targets: sprite,
            angle: { from: -6, to: 6 },
            yoyo: true,
            repeat: -1,
            duration: 400,
            ease: 'Circ.inout'
        });
        scene.tweens.add({
            targets: sprite,
            y: -3,
            yoyo: true,
            repeat: -1,
            duration: 200,
            ease: 'Sine.inout'
        });
    });

    scene.time.delayedCall(18000, () => {
        fadeOutAndDestroy(scene, container, 2000);
    });

    return container;
}