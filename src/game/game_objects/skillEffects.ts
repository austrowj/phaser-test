import * as ecs from 'bitecs';
import { Heading, rotateHeading, xy } from "../world/parameters";
import { EntityBuilder } from '../../util/entityBuilder';
import { SpriteConfig, SpriteCreatedCallback } from '../systems/spriteManager';

export function makeWindBlast(
    world: ecs.World,
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
    world: ecs.World,
    originator: Phaser.GameObjects.Sprite,
    heading: Heading,
    effectsGroup: Phaser.Physics.Arcade.Group,
    cloneLevel: number
) {

    new EntityBuilder(world)
        .addAoS(SpriteConfig, {
            x: originator.x,
            y: originator.y,
            textureKey: 'flares',
            frame: 'white'
        })
        .createRelated(SpriteCreatedCallback, (blast: Phaser.GameObjects.Sprite) => {

            effectsGroup.add(blast);
            const body = blast.body as Phaser.Physics.Arcade.Body;
            blast.setScale(0.5);
            blast.setData('originator', originator);
            body.setCircle(30, blast.width/2 * blast.scaleX, blast.height/2 * blast.scaleY);
            body.setVelocity(...xy(heading, 800));

            if (cloneLevel > 0) {
                blast.on('destroy', () => {
                    for (const i of [-3, -2, -1, 0, 1, 2, 3, 4] as const) {
                        makeWindBlastForking(world, blast, rotateHeading(heading, i), effectsGroup, cloneLevel - 1);
                    }
                });
            }

            blast.scene.time.delayedCall(400, () => {
                blast.destroy();
            });

        });
}