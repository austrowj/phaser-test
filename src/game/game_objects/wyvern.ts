import { ArcadeBody, Wyvern } from "./wyvernDriver";
import { SpriteComponent, WyvernAnimation } from "./animatedWyvern";

import * as ecs from 'bitecs';
import { Heading } from "../world/parameters";
import { addEC, addSimpleEC, Initialize } from "../../util/initComponent";

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

    addSimpleEC(world, eid, Heading, 'S');
    addSimpleEC(world, eid, SpriteComponent, sprite);
    addEC(world, eid, WyvernAnimation, {animation: 'Idle', variant: 'earth'});
    addEC(world, eid, Wyvern, {
        state: 'Idle',
        timeRate: sizeConfig[size].rate,
        scale: sizeConfig[size].scale,
        topSpeed: sizeConfig[size].topSpeed,
        effectsGroup: effectsGroup,
    });

    // Make sure physics are configured.
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, 108, 100);
    sprite.setScale(sizeConfig[size].scale);
    addSimpleEC(world, eid, ArcadeBody, body);

    // Adjust animation speed based on size.
    sprite.anims.timeScale = sizeConfig[size].rate;

    ecs.addComponent(world, eid, Initialize);
    return { eid, sprite: sprite, size };
}
