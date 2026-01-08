export function fadeOutAndDestroy(
    scene: Phaser.Scene,
    gameObject: Phaser.GameObjects.GameObject,
    duration: number = 1000
) {
    scene.tweens.add({
        targets: gameObject,
        alpha: 0,
        duration: duration,
        onComplete: () => {
            gameObject.destroy();
        }
    });
}