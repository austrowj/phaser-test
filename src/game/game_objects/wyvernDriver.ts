import { Heading, HeadingVectors, xy } from '../world/parameters';

import * as ecs from 'bitecs';
import { BreathAttack, EffectOf, makeWindBlastForking } from './skillEffects';
import { Sprite } from '../systems/spriteManager';

export const WyvernVariant = ['earth', 'air', 'fire', 'water'] as const;
export type WyvernVariant = typeof WyvernVariant[number];

export type WyvernState = 'Idle' | 'Move' | 'Dash' | 'WingBlast' | 'BreathAttack' | 'Slam';

export const Controls = {
    steer: [] as (Heading | undefined)[],
    dash: [] as boolean[],
    wingBlast: [] as boolean[],
    breathe: [] as boolean[],
}

export const Wyvern = {
    variant: [] as WyvernVariant[],
    timeRate: [] as number[],
    state: [] as WyvernState[],
    scale: [] as number[],
    topSpeed: [] as number[],
    effectsGroup: [] as Phaser.Physics.Arcade.Group[],
    heading: [] as Heading[],
}

export function createWyvernDriverSystem(world: ecs.World) {
       
    const steer = (eid: number, h: Heading, body: Phaser.Physics.Arcade.Body) => {
        Wyvern.heading[eid] = h;
        body.setVelocity(...xy(h, Wyvern.topSpeed[eid] / Wyvern.scale[eid]));
    }

    const stop = (eid: number, body: Phaser.Physics.Arcade.Body) => {
        Wyvern.state[eid] = 'Idle';
        body.setVelocity(0, 0);
    }

    const dash = (eid: number, sprite: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) => {
        body.setVelocity(0, 0);
        Wyvern.state[eid] = 'Dash';

        sprite.scene.tweens.add({
            targets: sprite,
            // Make wyvern disappear then reappear at high speed.
            alpha: { from: 1, to: 0 },
            ease: 'Cubic.inOut',
            duration: 250,
            yoyo: true,
        });
        sprite.scene.time.delayedCall(100, () => body.setVelocity(...xy(Wyvern.heading[eid], Wyvern.topSpeed[eid] / Wyvern.scale[eid] * 6.0)) );
        sprite.scene.time.delayedCall(500, () => stop(eid, body) );
    }

    const wingBlast = (eid: number, sprite: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) => {
        const timeRate = Wyvern.timeRate[eid];
        const effectsGroup = Wyvern.effectsGroup[eid];
        const heading = Wyvern.heading[eid];

        body.setVelocity(0, 0);
        Wyvern.state[eid] = 'WingBlast';
        sprite.scene.time.delayedCall(140 / timeRate, () => makeWindBlastForking(world, sprite, heading, effectsGroup, 2) );
        sprite.scene.time.delayedCall(500 / timeRate, () => stop(eid, body) );
    }

    const breathAttack = (eid: number, sprite: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) => {
        const heading = Wyvern.heading[eid];
        
        body.setVelocity(0, 0);
        Wyvern.state[eid] = 'BreathAttack';

        // Compute starting point and angle for the breath attack.
        const headingVector = HeadingVectors[heading];
        const breathPoint = {
            x: sprite.x + headingVector.x * 50 * sprite.scale,
            y: sprite.y + headingVector.y * 50 * sprite.scale
        };

        new BreathAttack(world, eid, sprite, Wyvern.effectsGroup[eid], heading, breathPoint.x, breathPoint.y);
    }

    const stopBreathAttack = (eid: number) => {
        for (const effectEID of ecs.query(world, [EffectOf(eid)])) {
            const effect = EffectOf(effectEID)[eid];
            if (effect.tag === 'breathAttackParticles') {
                const particles = effect.effects.particles as Phaser.GameObjects.Particles.ParticleEmitter;
                const timer = effect.effects.timer as Phaser.Time.TimerEvent;
                particles.stop();
                // Delay destruction to allow particles to finish.
                particles.scene.time.delayedCall(1000, () => {
                    particles.destroy();
                });
                timer.remove();
                ecs.removeEntity(world, effectEID);
            }
        }
    }

    const handleControls = (eid: number, sprite: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) => {
        switch (Wyvern.state[eid]) {

            case 'Idle':
                if (Controls.dash[eid]) { dash(eid, sprite, body); }
                else if (Controls.wingBlast[eid]) { wingBlast(eid, sprite, body); }
                else if (Controls.breathe[eid]) { breathAttack(eid, sprite, body); }
                else if (Controls.steer[eid]) {
                    Wyvern.state[eid] = 'Move';
                    steer(eid, Controls.steer[eid], body);
                }
                break;

            case 'Move':
                if (Controls.dash[eid]) { dash(eid, sprite, body); }
                else if (Controls.wingBlast[eid]) { wingBlast(eid, sprite, body); }
                else if (Controls.breathe[eid]) { breathAttack(eid, sprite, body); }
                else if (Controls.steer[eid]) { steer(eid, Controls.steer[eid], body); }
                else { stop(eid, body); }
                break;
            
            case 'BreathAttack':
                if (Controls.dash[eid]) {
                    stopBreathAttack(eid);
                    dash(eid, sprite, body);
                    
                }
                else if (!Controls.breathe[eid]) {
                    stop(eid, body);
                    stopBreathAttack(eid);
                }
                break;
        }
    }
    
    return () => {
        for (const eid of ecs.query(world, [Wyvern, Controls, Sprite])) {
            const sprite = Sprite[eid];
            const body = sprite.body as Phaser.Physics.Arcade.Body;
            handleControls(eid, sprite, body);
        }
    }

}
