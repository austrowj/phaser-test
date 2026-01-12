import { Heading, rotateHeading, xy } from "../world/parameters";

export function makeWindBlast(
    originator: Phaser.GameObjects.Sprite,
    heading: Heading,
    effectsGroup: Phaser.Physics.Arcade.Group,
) {

    const blast = effectsGroup.create(originator.x, originator.y, 'flares', 'white');
    const body = blast.body! as Phaser.Physics.Arcade.Body;
    blast.setScale(0.5);
    blast.setData('originator', originator);
    body.setCircle(30, blast.width/2 * blast.scaleX, blast.height/2 * blast.scaleY);
    body.setVelocity(...xy(heading, 800));

    originator.scene.time.delayedCall(2000, () => {
        blast.destroy();
    });
}

export function makeWindBlastForking(
    originator: Phaser.GameObjects.Sprite,
    heading: Heading,
    effectsGroup: Phaser.Physics.Arcade.Group,
) {

    const blast = effectsGroup.create(originator.x, originator.y, 'flares', 'white') as Phaser.Physics.Arcade.Sprite;
    const body = blast.body as Phaser.Physics.Arcade.Body;
    blast.setScale(0.5);
    blast.setData('originator', originator);
    body.setCircle(30, blast.width/2 * blast.scaleX, blast.height/2 * blast.scaleY);
    body.setVelocity(...xy(heading, 800));

    blast.on('destroy', () => {
        for (const i of [-4, -3, -2, -1, 0, 1, 2, 3, 4] as const) {
            makeWindBlast(blast, rotateHeading(heading, i), effectsGroup);
        }
    });

    originator.scene.time.delayedCall(400, () => {
        blast.destroy();
    });
}