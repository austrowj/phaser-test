import { Wyvern } from "./wyvernDriver";
import { WyvernAnimation } from "./animatedWyvern";

import * as ecs from 'bitecs';
import { addEC, Initialize } from "../../util/initComponent";

const sizeConfig = {
    'small':  { scale: 0.25, rate: 1.5, topSpeed: 100 },
    'medium': { scale: 0.50, rate: 1.0, topSpeed: 100 },
    'large':  { scale: 1.00, rate: 0.7, topSpeed: 100 }
}

export type Wyvern = ReturnType<typeof createWyvern>;

export function createWyvern(
    world: ecs.World,
    sprite: Phaser.GameObjects.Sprite,
    effectsGroup: Phaser.Physics.Arcade.Group,
    size: keyof typeof sizeConfig = 'medium',
) {
    const eid = ecs.addEntity(world);

    // Make sure physics are configured.
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, 108, 100);
    sprite.setScale(sizeConfig[size].scale);

    addEC(world, eid, WyvernAnimation, {animation: 'Idle', variant: 'earth', heading: 'S', sprite: sprite});
    addEC(world, eid, Wyvern, {
        state: 'Idle',
        timeRate: sizeConfig[size].rate,
        scale: sizeConfig[size].scale,
        topSpeed: sizeConfig[size].topSpeed,
        effectsGroup: effectsGroup,
        sprite: sprite,
        body: body,
        heading: 'S',
        particles: null,
    });

    // Adjust animation speed based on size.
    sprite.anims.timeScale = sizeConfig[size].rate;

    ecs.addComponent(world, eid, Initialize);
    return { eid, sprite: sprite, size };
}
