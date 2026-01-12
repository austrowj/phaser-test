import * as ecs from 'bitecs';

export function addEC<T extends {[key: string]: any}>(
    world: ecs.World,
    eid: number,
    component: T,
    params: {[key in keyof T]: T[key][number]}, // The type of a single entry in the component.
) {
    ecs.addComponent(world, eid, component);
    for (const [key, value] of Object.entries(params)) {
        component[key][eid] = value;
    }
}

export function addSimpleEC<T extends any[]>(
    world: ecs.World,
    eid: number,
    component: T,
    param: T[number]
) {
    ecs.addComponent(world, eid, component);
    component[eid] = param;
    return eid;
}

export function addTagEC<T extends Record<string, never>>( // Component with no data fields.
    world: ecs.World,
    eid: number,
    component: T
) {
    ecs.addComponent(world, eid, component);
    return eid;
}
/*
export const Initialize = {};
export function cleanup(world: ecs.World) {
    for (const eid of ecs.query(world, [Initialize])) {
        ecs.removeComponent(world, eid, Initialize);
    }
}
*/