import * as ecs from 'bitecs';

// Fluent interface for creating bitECS entities.
export class EntityBuilder {

    private _eid: number;

    constructor(private world: ecs.World, existingEID?: number) {
        if (existingEID == undefined) { this._eid = ecs.addEntity(this.world); }
        else { this._eid = existingEID; }
    }

    public addSoA<T extends {[key: string]: any}>(
        component: T,
        params: {[key in keyof T]: T[key][number]}, // The type of a single entry in the component.
    ) {
        ecs.addComponent(this.world, this._eid, component);
        for (const [key, value] of Object.entries(params)) {
            component[key][this._eid] = value;
        }
        return this;
    }

    public addAoS<T extends any[]>(component: T, param: T[number]) {
        ecs.addComponent(this.world, this._eid, component);
        component[this._eid] = param;
        return this;
    }

    public createRelated<R, T extends ecs.Relation<R[]>>(relation: T, values: R) {
        const relatedEID = ecs.addEntity(this.world);
        ecs.addComponent(this.world, relatedEID, relation(this._eid));
        relation(relatedEID)[this._eid] = values;

        return {builder: this, relatedEID};
    }

    public eid(): number { return this._eid; }
}