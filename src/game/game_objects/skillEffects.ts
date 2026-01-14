import * as ecs from 'bitecs';
import { Heading, rotateHeading, xy } from "../world/parameters";
import { EntityBuilder } from '../../util/entityBuilder';
import { SpriteConfig, SpriteCreatedCallback } from '../systems/spriteManager';

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
                        const decrease = Phaser.Math.Between(0, 15) < 15 ? 1 : 0;
                        makeWindBlastForking(world, blast, rotateHeading(heading, i), effectsGroup, cloneLevel - decrease);
                    }
                });
            }

            blast.scene.time.delayedCall(350 + Phaser.Math.Between(0, 100), () => {
                blast.destroy();
            });

        });
}