import { monsters4 } from '../data/spritesheetMaps';
import { Step, xy } from '../world/parameters';
import { fadeOutAndDestroy } from './effects';

export function createKing(scene: Phaser.Scene, x: number, y: number) {

    const container = scene.add.container(x, y);
    const sprite = scene.add.sprite(0, 0, 'monsters4', monsters4.indexOf.KingArthur);
    container.add(sprite);

    scene.physics.add.existing(container);
    (container.body as Phaser.Physics.Arcade.Body)
        .setCircle(16)
        .setVelocity(...xy('SW', 2*Step))
    ;
    
    scene.time.delayedCall(18000, () => {
        fadeOutAndDestroy(scene, container, 2000);
    });

    return container;
}