import * as ecs from 'bitecs';
import { Health, Killable } from '../components/health.js';

export function checkForKill(world: ecs.World, _: number, delta: number) {
    for (const eid of ecs.query(world, [Health, Killable])) {

        Health.current[eid] = Math.max(0, Math.min(Health.max[eid], Health.current[eid] + Health.rate[eid] * (delta / 1000)));

        if (Health.current[eid] <= 0) {
            console.log(`Entity ${eid} has died.`);
            Killable.shouldDie[eid] = true;
        }
    }
}

export function kill(world: ecs.World) {
    for (const eid of ecs.query(world, [Killable])) {
        if (Killable.shouldDie[eid]) {
            Killable.shouldDie[eid] = false;
            ecs.removeEntity(world, eid);
            console.log(`Entity ${eid} has been removed from the world.`);
        }
    }
}