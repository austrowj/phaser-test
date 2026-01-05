import { Communicator } from '../../util/communicator';
import { Heading } from '../world/parameters';
import { animationData, WyvernAnimation } from './wyvernAnimationData';

const HeadingIndexes = {
    W:  0,
    NW: 1,
    N:  2,
    NE: 3,
    E:  4,
    SE: 5,
    S:  6,
    SW: 7,
} as const satisfies Record<Heading, number>;
type WyvernFrameIndex = typeof HeadingIndexes[keyof typeof HeadingIndexes];

const Variants = ['earth', 'air', 'fire', 'water'] as const;
type Variant = typeof Variants[number];

type AnimationKey = `${Variant}_${WyvernAnimation}_${Heading}`;

const BaseBehaviors = {
    Hover:   { index: 0 },
    Fly:     { index: 1 },
    Sting:   { index: 2 },
    Breathe: { index: 3 },
    Ram:     { index: 4 },
    Hit:     { index: 5 },
    Die:     { index: 6 },
} as const;
type BaseBehavior = keyof typeof BaseBehaviors;

// Designed for external use and/or reference.

export class WyvernAnimationDriver {

    public comms = new Communicator<{
        change: (animationKey: AnimationKey) => void,
        //headingChange: (heading: Heading) => void,
        //animationChange: (animation: WyvernAnimation) => void,
    }>();

    public getCurrentHeading() { return this.currentHeading; }
    public getCurrentAnimation() { return this.currentAnimation; }

    private currentHeading: Heading = 'S';
    private currentAnimation: WyvernAnimation;

    constructor(private variant: Variant) { this.setAnimation('Idle'); }

    private getAnimationKey(): AnimationKey {
        return `${this.variant}_${this.currentAnimation}_${this.currentHeading}`;
    }

    public setHeading(heading: Heading) {
        this.currentHeading = heading;
        this.comms.send('change', this.getAnimationKey());
        //this.comms.send('headingChange', heading);
    }

    public setAnimation(animation: WyvernAnimation) {
        this.currentAnimation = animation;
        this.comms.send('change', this.getAnimationKey());
        //this.comms.send('animationChange', animation);
    }
}

function variantSpriteKey(variant: Variant): string {
    return 'wyvern_' + variant;
}

function createAnimationConfigs(
    key: string,
    variant: Variant,
    params: {
        base: BaseBehavior,
        animConfig: Phaser.Types.Animations.Animation & {
            frames?: never,
            defaultTextureKey?: never,
            key?: never,
        },
        framesTemplate: readonly (Phaser.Types.Animations.AnimationFrame & {
            key?: never,
            frame: WyvernFrameIndex
        })[]
    }
): Phaser.Types.Animations.Animation[] {

    return Object.entries(HeadingIndexes).map(([heading, index]) => ({
        ...params.animConfig,
        defaultTextureKey: variantSpriteKey(variant),
        frames: params.framesTemplate.map(frame => ({
            ...frame,
            frame:
                frame.frame
                + BaseBehaviors[params.base].index*8
                + index*8*7
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

    scene.load.on('complete', () => { // Eagerly register all the animations for every variant.
        console.log("Wyvern animations load complete, creating animations...");
        try {
            Object.entries(animationData).forEach(([key, args]) => {
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
