import { Wyvern } from "./wyvernDriver";
import { WyvernAnimation } from "./animatedWyvern";

import * as ecs from 'bitecs';
import { EntityBuilder } from "../../util/entityBuilder";
import { SpriteConfig, WhenSpriteCreated } from "../systems/spriteManager";

const sizeConfig = {
    'small':  { scale: 0.25, rate: 1.5, topSpeed: 100 },
    'medium': { scale: 0.50, rate: 1.0, topSpeed: 100 },
    'large':  { scale: 1.00, rate: 0.7, topSpeed: 100 }
}

export type Wyvern = ReturnType<typeof createWyvern>;

export function createWyvern(
    world: ecs.World,
    position: { x: number; y: number},
    effectsGroup: Phaser.Physics.Arcade.Group,
    size: keyof typeof sizeConfig = 'medium',
) {

    return new EntityBuilder(world)
        .addSoA(WyvernAnimation, {state: 'Idle', variant: 'earth', heading: 'S'})
        .addSoA(Wyvern, {
            variant: 'earth',
            state: 'Idle',
            timeRate: sizeConfig[size].rate,
            scale: sizeConfig[size].scale,
            topSpeed: sizeConfig[size].topSpeed,
            effectsGroup: effectsGroup,
            heading: 'S',
            //particles: null,
        })
        .addAoS(SpriteConfig, {
            x: position.x,
            y: position.y,
            textureKey: '',
            origin: [0.5, 0.5],
            scale: sizeConfig[size].scale,
            depth: 10,
        })
        .createRelated(WhenSpriteCreated, (sprite: Phaser.GameObjects.Sprite) => {
            // Configure physics body.
            const body = sprite.body as Phaser.Physics.Arcade.Body;
            body.setCircle(20, 108, 100);
        })
        .builder;
}
