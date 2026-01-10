import { AnimatedWyvern } from "./animatedWyvern";
import { WyvernDriver } from "./wyvernDriver";

const sizeConfig = {
    'small':  { scale: 0.25, rate: 1.5, topSpeed: 300 },
    'medium': { scale: 0.50, rate: 1.0, topSpeed: 200 },
    'large':  { scale: 1.00, rate: 0.7, topSpeed: 150 }
}

export type Wyvern = ReturnType<typeof createWyvern>;

export function createWyvern(
    visual: AnimatedWyvern,
    skillset: WyvernDriver,
    effectsGroup: Phaser.Physics.Arcade.Group,
    size: keyof typeof sizeConfig = 'medium',
) {
    // Make sure physics are configured.
    const body = visual.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, 108, 100);
    visual.sprite.setScale(sizeConfig[size].scale);

    // Adjust animation speed based on size.
    visual.sprite.anims.timeScale = sizeConfig[size].rate;
    skillset.setTimeRate(sizeConfig[size].rate);

    // Connect the controller to the animation driver and the physics body.
    skillset.comms
        .when('setAnimation', (animation) => visual.setAnimation(animation))
        .when('setHeading', (heading) => visual.setHeading(heading))
        .when('stop', () => body.setVelocity(0, 0))
        .when('go', (vector, scale) => body.setVelocity(
            vector.x * scale * sizeConfig[size].topSpeed,
            vector.y * scale * sizeConfig[size].topSpeed
        ))
        .when('useSkill', (callback) => callback(visual.sprite, effectsGroup, visual.getCurrentHeading()));
    
    // Initialize animation state.
    visual.setAnimation('Idle');
    skillset.startTick(visual.sprite.scene);
    return { sprite: visual.sprite, skillset, size };
}
