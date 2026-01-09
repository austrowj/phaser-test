import { monsters1 } from "../data/spritesheetMaps";
import { Step, xy } from "../world/parameters";
import { fadeOutAndDestroy } from "./effects";

export function createDwarf(scene: Phaser.Scene, x: number, y: number, physicsGroup?: Phaser.Physics.Arcade.Group) {

    const sprite = scene.add.sprite(x, y, 'monsters1', monsters1.indexOf.Dwarf);
    //sprite.setOrigin(0.5, 1);
    sprite.setCrop(1, 0, sprite.width - 2, sprite.height); // A little green bleeds into the sprite
    sprite.flipX = true;

    if (physicsGroup) {
        physicsGroup.add(sprite);
        (sprite.body as Phaser.Physics.Arcade.Body)
            .setCircle(16)
            .setVelocity(...xy('SW', 2*Step))
        ;
    }

    
    scene.time.delayedCall(Phaser.Math.Between(0, 500), () => {
        scene.tweens.add({
            targets: sprite,
            angle: { from: -3, to: 3 },
            yoyo: true,
            repeat: -1,
            duration: 400,
            ease: 'Circ.inout'
        });/*
        scene.tweens.add({
            targets: sprite,
            y: -3,
            yoyo: true,
            repeat: -1,
            duration: 200,
            ease: 'Sine.inout'
        });*/
    });

    scene.time.delayedCall(18000, () => {
        fadeOutAndDestroy(scene, sprite, 2000);
    });

    return sprite;
}