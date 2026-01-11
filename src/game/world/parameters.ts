export type Heading = keyof typeof HeadingVectors;
export const HeadingVectors = {
    N:  new Phaser.Math.Vector2( 0, -1).normalize(),
    NE: new Phaser.Math.Vector2( 2, -1).normalize(),
    E:  new Phaser.Math.Vector2( 1,  0).normalize(),
    SE: new Phaser.Math.Vector2( 2,  1).normalize(),
    S:  new Phaser.Math.Vector2( 0,  1).normalize(),
    SW: new Phaser.Math.Vector2(-2,  1).normalize(),
    W:  new Phaser.Math.Vector2(-1,  0).normalize(),
    NW: new Phaser.Math.Vector2(-2, -1).normalize(),
} as const;

export const Heading = [] as Heading[]; // For ECS

export const Step = 32;

export function xy(heading: Heading, distance: number, origin?: [number, number]): [number, number] {
    if (origin) {
        return [
            origin[0] + HeadingVectors[heading].x * distance,
            origin[1] + HeadingVectors[heading].y * distance
        ];
    }
    return [
        HeadingVectors[heading].x * distance,
        HeadingVectors[heading].y * distance
    ];
}
