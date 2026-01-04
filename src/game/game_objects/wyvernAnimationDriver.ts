import * as z from 'zod';
import { Communicator } from '../../util/communicator';

// Designed for external use and/or reference.

const WyvernAnimations = ['Idle', 'Move', 'Dash', 'BreathAttack'] as const;

type AnimationKey = `${Variant}_${WyvernAnimation}_${Heading}`;

export type Heading = keyof typeof Headings;
export type WyvernAnimation = typeof WyvernAnimations[number];

export class WyvernAnimationDriver {

    public comms = new Communicator<{
        change: (animationKey: AnimationKey) => void,
        //headingChange: (heading: Heading) => void,
        //animationChange: (animation: WyvernAnimation) => void,
    }>();

    private currentHeading: Heading = 'S';
    private currentAnimation: WyvernAnimation;

    constructor(private variant: Variant) { this.setAnimation('Idle'); }

    private getAnimation(): AnimationKey {
        return `${this.variant}_${this.currentAnimation}_${this.currentHeading}`;
    }

    public setHeading(heading: Heading) {
        this.currentHeading = heading;
        this.comms.send('change', this.getAnimation());
        //this.comms.send('headingChange', heading);
    }

    public setAnimation(animation: WyvernAnimation) {
        this.currentAnimation = animation;
        this.comms.send('change', this.getAnimation());
        //this.comms.send('animationChange', animation);
    }
    
    public getHeadingVector(): Phaser.Math.Vector2 {
        return Headings[this.currentHeading].vector;
    }
}

// Data-driven definitions.

const Variants = ['earth', 'air', 'fire', 'water'] as const;

export const Headings = {
    W:  { index: 0, vector: new Phaser.Math.Vector2(-1,  0).normalize() },
    NW: { index: 1, vector: new Phaser.Math.Vector2(-2, -1).normalize() },
    N:  { index: 2, vector: new Phaser.Math.Vector2( 0, -1).normalize() },
    NE: { index: 3, vector: new Phaser.Math.Vector2( 2, -1).normalize() },
    E:  { index: 4, vector: new Phaser.Math.Vector2( 1,  0).normalize() },
    SE: { index: 5, vector: new Phaser.Math.Vector2( 2,  1).normalize() },
    S:  { index: 6, vector: new Phaser.Math.Vector2( 0,  1).normalize() },
    SW: { index: 7, vector: new Phaser.Math.Vector2(-2,  1).normalize() },
} as const;

const BaseBehaviors = {
    Hover:   { index: 0 },
    Fly:     { index: 1 },
    Sting:   { index: 2 },
    Breathe: { index: 3 },
    Ram:     { index: 4 },
    Hit:     { index: 5 },
    Die:     { index: 6 },
} as const;

// Type setup for animation JSON validation.

type Variant = typeof Variants[number];
type BaseBehavior = keyof typeof BaseBehaviors;
type WyvernFrameIndex = typeof Headings[keyof typeof Headings]['index'];

const WyvernAnimationDefinition = z.strictObject({
    base: z.union(Object.keys(BaseBehaviors).map(k => z.literal(k as BaseBehavior))),
    animConfig: z.strictObject({
        frameRate: z.number().optional(),
        duration: z.number().optional(),
        skipMissedFrames: z.boolean().optional(),
        delay: z.number().optional(),
        repeat: z.number().optional(),
        repeatDelay: z.number().optional(),
        yoyo: z.boolean().optional(),
        showBeforeDelay: z.boolean().optional(),
        showOnStart: z.boolean().optional(),
        hideOnComplete: z.boolean().optional(),
        randomFrames: z.boolean().optional()
    }),
    framesTemplate: z.array(z.strictObject({
        frame: z.union(Object.values(Headings).map(h => z.literal(h.index as WyvernFrameIndex))),
        duration: z.number().optional(),
        visible: z.boolean().optional()
    }))
});

const WyvernAnimationDefinitions = z.strictObject(
    Object.fromEntries(WyvernAnimations.map(anim => [anim, WyvernAnimationDefinition]))
);

function variantSpriteKey(variant: Variant): string {
    return 'wyvern_' + variant;
}

/** This looks super cursed but it should work.
    The idea is that you can pass any type of animation config and frame data,
    then this will generate the configs for all 8 heading variants.
*/
function createAnimationConfigs(
    key: string,
    variant: Variant,
    params: {
        base: BaseBehavior,
        animConfig: Omit<Phaser.Types.Animations.Animation, 'frames' | 'defaultTextureKey' | 'key'>,
        framesTemplate: (Omit<Phaser.Types.Animations.AnimationFrame, 'key'> & {frame: WyvernFrameIndex})[]
    }
): Phaser.Types.Animations.Animation[] {

    return Object.entries(Headings).map(([heading, headingData]) => ({
        ...params.animConfig,
        defaultTextureKey: variantSpriteKey(variant),
        frames: params.framesTemplate.map(frame => ({
            ...frame,
            frame:
                frame.frame
                + BaseBehaviors[params.base].index*8
                + headingData.index*8*7
        })),
        key: key + '_' + heading
    }));
}

// Loader function to be called in a Phaser scene's preload().

export function load(scene: Phaser.Scene) {

    Variants.forEach(variant => {
        scene.load.spritesheet(
            'wyvern_' + variant,
            'character/wyvern_' + variant + '.png',
            { frameWidth: 256, frameHeight: 256 }
        );
    });

    scene.load.json('wyvernAnimations', '../data/wyvernAnimations.json');
    scene.load.on('complete', () => { // Eagerly register all the animations for every variant.
        console.log("Wyvern animations load complete, creating animations...");
        try {
            const rawData = scene.cache.json.get('wyvernAnimations');
            const parsedDefs = WyvernAnimationDefinitions.parse(rawData);

            Object.entries(parsedDefs).forEach(([key, args]) => {
                Object.entries(Variants).forEach(([_, variant]) => {
                    const newAnims = createAnimationConfigs(variant + '_' + key, variant, args);
                    newAnims.forEach(config => { scene.anims.create(config); });
                });
            });
        } catch (error) {
            console.error("Failed to load wyvern animations JSON:", error);
        }
        console.log("Wyvern animations created.");
    });
}
