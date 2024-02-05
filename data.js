// @ts-check
"use strict";

/**
 * Many methods on the Data class take an "identifier" of a snapshot, which can be:
 * @typedef {string            // Matches the portion of the snapshot name up to the first colon
 *          |symbol            // Matches the snapshot's tag
 *          |number            // References the index or negative index-from-end on the snapshotStack
 *          |DataSnapshot      // Matches only that exact snapshot; can be used to operate against off-stack snapshots
 *          |{id:number}       // Matches the snapshot's id (provided by Data.getObjectId)
 * } SnapshotIdentifier
 * 
 * Types for snapshot export:
 * @typedef {{
 *  id: number,
 *  name: string,
 *  prototypeId: number,
 *  values: Record<string,any>,
 *  refs: Record<string,number>,
 *  deleted: string[],
 * }} SnapshotExportRecord
 * 
 * @typedef {Record<number, Record<string, number>>} SnapshotIdMap
 * 
 * @typedef {{
 *  name: string,
 *  id: number,
 *  rootId: number,
 *  objects: Record<number, SnapshotExportRecord>,
 *  idList: number[],
 * }} BaseSnapshotExport
 * 
 * @typedef {BaseSnapshotExport & {
 *  type: "static",
 * }} StaticSnapshotExport
 * 
 * @typedef {BaseSnapshotExport & {
 *  type: "delta",
 *  baseId: number,
 * }} DeltaSnapshotExport
 * 
 * @typedef {StaticSnapshotExport | DeltaSnapshotExport} SnapshotExport
 */

class SnapshotMissingError extends ReferenceError {
    /** @type {number} */
    id;

    /** @param {number} id  */
    constructor(id) {
        super();
        this.id = id;
    }
}

class Data {
    /** @type {Record<string, object>} */
    static rootObjects = {__proto__: null};
    /** @type {DataSnapshot[]} */
    static snapshotStack = [];
    static get defaultSnapshot() { return this.snapshotStack[0]; }
    static get baseSnapshot() { return this.snapshotStack[1]; }
    /** @type {WeakMap<object, number>} */
    static objectIdMap = new WeakMap();
    // these language invariants need a way to have their identities transmitted across thread boundaries
    static get wellKnownObjects() {
        const wellKnownObjects = Object.freeze({
            __proto__: null,
            [-1]: Object.prototype,
            [-2]: Array.prototype,
            [-3]: Town.prototype,
            [-4]: Stat.prototype,
            [-5]: LevelExp.prototype,
            [-6]: Skill.prototype,
            [-7]: Buff.prototype,
            [-8]: ImmutableRational.prototype,
            [-9]: Rational.prototype,
        });
        Object.defineProperty(this, "wellKnownObjects", {
            value: wellKnownObjects,
            writable: false,
            configurable: true,
        });
        // set the well-known ids, all negative
        for (const [id, obj] of Object.entries(wellKnownObjects)) {
            this.setObjectId(obj, parseInt(id));
        }
        return wellKnownObjects;
    }
    /** @satisfies {{[K in keyof typeof Data.wellKnownObjects]: (record: typeof Data.wellKnownObjects[K]) => typeof Data.wellKnownObjects[K]}} */
    static wellKnownConstructors = {
        __proto__: null,
        [-1]: () => ({}),
        [-2]: () => [],
        [-3]: t => new Town(t.index),
        [-4]: s => new Stat(s.name),
        [-5]: () => new LevelExp(),
        [-6]: s => new Skill(s.name),
        [-7]: b => new Buff(b.name),
        [-8]: r => new ImmutableRational(r),
        [-9]: r => new Rational(r),
    }
    static #nextObjectId = 1;

    static getObjectId(obj, assignNew=true) {
        if (!obj || typeof obj !== "object") {
            return null;
        }
        if (obj === this.defaultSnapshot) {
            // special value 0 means "the default snapshot", which doesn't get passed between threads
            return 0;
        }
        let id = this.objectIdMap.get(obj);
        if (!id && assignNew) {
            id = this.#nextObjectId++;
            this.objectIdMap.set(obj, id);
        }
        return id;
    }

    static setObjectId(obj, id) {
        if (!obj || typeof obj !== "object") {
            console.error("Tried to set object id for non-object",obj);
            return;
        }
        const oldId = this.objectIdMap.get(obj)
        if (oldId && oldId !== id) {
            console.warn(`Changing object id from ${oldId} to ${id}! possible collision`)
        }
        this.objectIdMap.set(obj, id);
        this.#nextObjectId = Math.max(this.#nextObjectId, id + 1);
    }

    static {
        // root always gets id 1
        this.setObjectId(this.rootObjects, 1);
    }

    /** @type {<T>(key: string, object: T) => T} */
    static register(key, object) {
        Data.rootObjects[key] = object;
        this.getObjectId(object);
        return object;
    }

    /** @type {(objects: {[key: string]: {}}) => void} */
    static registerAll(objects) {
        for (const key in objects) {
            this.register(key, objects[key]);
        }
    }

    static recordDefaults(resetData = false) {
        // initialize the well-known object ids
        this.wellKnownObjects;
        if (resetData) {
            this.snapshotStack.length = 0;
        }
        if (this.snapshotStack.length === 0) {
            this.recordSnapshot("defaults", null, 0);
        }
        return this.snapshotStack[0];
    }

    static recordBase() {
        if (this.snapshotStack.length === 0) {
            throw new Error("Tried to record base with no defaults layer");
        }
        this.snapshotStack.length = 1;
        return this.recordSnapshot("base");
    }

    /** @param {SnapshotIdentifier} identifier */
    static getSnapshotIndex(identifier) {
        return identifier instanceof DataSnapshot ? this.snapshotStack.lastIndexOf(identifier)
             : typeof identifier === "symbol" ? this.findSnapshotIndex(s => s.tag === identifier)
             : typeof identifier === "string" ? this.findSnapshotIndex(s => s.name.split(":", 1)[0] === identifier)
             : typeof identifier === "number" ? (identifier >= 0 ? identifier : this.snapshotStack.length + identifier)
             : typeof identifier?.id === "number" ? this.findSnapshotIndex(s => s.id === identifier.id)
             : -1;
    }

    /** @param {SnapshotIdentifier} identifier */
    static getSnapshot(identifier) {
        return identifier instanceof DataSnapshot ? identifier : this.snapshotStack[this.getSnapshotIndex(identifier)];
    }

    /** @param {(snapshot: DataSnapshot) => boolean} predicate  */
    static findSnapshotIndex(predicate) {
        for (let i = this.snapshotStack.length - 1; i >= 0; i--) {
            if (predicate(this.snapshotStack[i])) {
                return i;
            }
        }
        return -1;
    }
    /** @param {(snapshot: DataSnapshot) => boolean} predicate  */
    static findSnapshot(predicate) {
        return this.snapshotStack[this.findSnapshotIndex(predicate)];
    }

    /** @param {SnapshotIdentifier} identifier */
    static exportSnapshot(identifier) {
        return this.getSnapshot(identifier)?.export();
    }

    /** @param {SnapshotExport} data @param {DataSnapshot} [baseSnapshot] */
    static importSnapshot(data, baseSnapshot) {
        baseSnapshot ??= data.type !== "delta" ? null
                       : data.baseId === 0 ? this.defaultSnapshot
                       : Data.getSnapshot({id: data.baseId});
        if (data.type === "delta" && !baseSnapshot) {
            throw new SnapshotMissingError(data.baseId);
        }
        const snapshot = data.type === "static" ? new StaticSnapshot(data.name, data.id)
                       : data.type === "delta" ? new DeltaSnapshot(data.name, baseSnapshot, data.id)
                       : null;
        if (snapshot.import(data, this.rootObjects)) {
            this.snapshotStack.push(snapshot);
            return snapshot;
        }
        return null;
    }

    static exportDefaultIds() {
        return this.defaultSnapshot.exportIds();
    }

    /** @param {SnapshotIdMap} ids */
    static verifyDefaultIds(ids) {
        return this.defaultSnapshot.verifyIds(ids);
    }

    /**
     * @param {string} name Snapshot name, for debug and identification purposes
     * @param {SnapshotIdentifier|null} [baseIdentifier] Name, identifier, index, id, or snapshot to delta from; explicit null for a static snapshot, -1 or omitted for previous snapshot
     * @param {number} [explicitId] explicit id to assign to the new snapshot object
     * @returns {DataSnapshot | null} The new snapshot, or null if no change from previous delta
     */
    static recordSnapshot(name, baseIdentifier = -1, explicitId = undefined) {
        name = `${name}:${performance.now()}`;
        const startMark = performance.mark(`start-recordSnapshot:${name}`);
        const base = this.getSnapshot(baseIdentifier);
        const snapshot = base ? new DeltaSnapshot(name, base, explicitId) : new StaticSnapshot(name, explicitId);
        
        if (snapshot.recordData(this.rootObjects)) {
            this.snapshotStack.push(snapshot);
            const endMark = performance.mark(`complete-recordSnapshot:${name}`);
            performance.measure(`recordSnapshot:${name}`, startMark.name, endMark.name);
            return snapshot;
        }

        const endMark = performance.mark("empty-recordSnapshot");
        performance.measure(`recordSnapshot:${name}`, startMark.name, endMark.name);
        return null;
    }

    /** 
     * Discard down to the most recent snapshot called name, record a new delta against it, and replace it if there has been an update.
     * @param {string} name 
     * @param {string} [explicitBase] 
     */
    static updateSnapshot(name, explicitBase, maxHeritage = 10) {
        const oldSnapshot = this.discardToSnapshot(name);
        if (!oldSnapshot) {
            this.discardToSnapshot(explicitBase, 1); // discard to the explicit base but leave it on the stack
        }
        const newSnapshot = this.recordSnapshot(name, oldSnapshot?.heritageLength >= maxHeritage ? undefined : oldSnapshot);
        if (!newSnapshot && oldSnapshot) {
            this.snapshotStack.push(oldSnapshot);
        }
    }

    /** @param {SnapshotIdentifier} identifier */
    static revertToSnapshot(identifier, keepOnStack) {
        const startMark = performance.mark("start-revertToSnapshot");
        const targetSnapshot = this.getSnapshot(identifier);
        if (!targetSnapshot) {
            throw new Error(`Could not find snapshot ${String(identifier)} to revert to`);
        }
        while (this.snapshotStack.pop() !== targetSnapshot) {
        }
        if (keepOnStack) {
            this.snapshotStack.push(targetSnapshot);
        }
        targetSnapshot.applyState();
        const endMark = performance.mark("finish-revertToSnapshot");
        performance.measure("revertToSnapshot", startMark.name, endMark.name);
    }

    /** @param {SnapshotIdentifier} identifier */
    static rewindToSnapshot(identifier, keepOnStack) {
        const startMark = performance.mark("start-rewindToSnapshot");
        const targetSnapshot = this.getSnapshot(identifier);
        if (!targetSnapshot) {
            throw new Error(`Could not find snapshot ${String(identifier)} to revert to`);
        }
        // to start, we need to record the current state so we know what's changed since the latest snapshot
        let inverse = new DeltaSnapshot("current", this.snapshotStack[this.snapshotStack.length - 1]).recordData(this.rootObjects)?.invert();
        let snap;
        while (this.snapshotStack.length >= 1) {
            snap = this.snapshotStack.pop();
            if (snap === targetSnapshot) {
                break;
            }
            if (!(snap instanceof DeltaSnapshot)) {
                throw new Error(`Encountered non-delta snapshot ${snap.name} while trying to revert:`);
            }
            // otherwise, invert it and add to the composition
            inverse = inverse?.composeWith(snap.invert()) ?? snap.invert();
        }
        if (snap !== targetSnapshot) {
            throw new Error(`Did not get to snapshot ${targetSnapshot.name}? found ${snap.name}`);
        }
        if (snap instanceof DeltaSnapshot && !keepOnStack) {
            // add snap to the composition
            inverse = inverse?.composeWith(snap.invert()) ?? snap.invert();
        } else {
            // leave it on the stack
            this.snapshotStack.push(snap);
        }
        performance.mark("rewindToSnapshot-composed")
        console.log(`Reverting using composition ${inverse.name}:`, inverse);
        inverse.applySnapshot();
        const endMark = performance.mark("finish-rewindToSnapshot");
        performance.measure("rewindToSnapshot", startMark.name, endMark.name);
    }

    /** 
     * Discard snapshots until (by default) the specified snapshot has popped off the stack. If the identifier
     * does not match a snapshot, nothing is done and undefined is returned.
     * @param {SnapshotIdentifier} identifier
     * @returns {DataSnapshot} The last snapshot discarded, or undefined
     */
    static discardToSnapshot(identifier, delta = 0) {
        const index = this.getSnapshotIndex(identifier);
        if (index < 0) {
            return undefined;
        }
        this.snapshotStack.length = index + delta + 1;
        return this.snapshotStack.pop();
    }

    static resetToDefaults() {
        this.snapshotStack.length = 1;
        this.snapshotStack[0].applyState();
    }

    static resetToBase() {
        this.snapshotStack.length = 2;
        this.snapshotStack[1].applyState();
    }

    /**
     * @template {{}} O
     * @param {O} object
     * @param {(keyof O)[]} props
     */
    static omitProperties(object, props) {
        const omitRecords = /** @type {Partial<Record<keyof O, boolean>>} */ (DataSnapshot_OMIT in object ? object[DataSnapshot_OMIT] : {});
        Object.defineProperty(object, DataSnapshot_OMIT, {value: omitRecords, configurable: true});
        for (const prop of props) {
            omitRecords[prop] = true;
        }
    }

    static shallowCopy(object) {
        const clone = Object.create(Object.getPrototypeOf(object), Object.getOwnPropertyDescriptors(object));
        return clone;
    }

    static subkey(target, name, prop) {
        if (name === "") return prop;
        if (Array.isArray(target) && !isNaN(parseInt(prop))) {
            return `${name}[${prop}]`;
        }
        return `${name}.${prop}`;
    }
}

/* global consts for typing */
const DataSnapshot_NAME = Symbol("DataSnapshot_NAME");
const DataSnapshot_OWNER = Symbol("DataSnapshot_OWNER");
const DataSnapshot_DELETED = Symbol("DataSnapshot_DELETED");
const DataSnapshot_OMIT = Symbol("DataSnapshot_OMIT");
/** @typedef {{readonly [DataSnapshot_NAME]: string, readonly [DataSnapshot_OWNER]: symbol, readonly [prop: string]: any}} DataRecord */
/**
 * Creates and holds a DataRecord as it is being recorded
 */
class DataRecorder {
    /** @type {string} */
    name;
    /** @type {symbol} */
    owner;
    /** @type {DataRecord | null} */
    base;
    /** @type {DataRecord & Record<string, any>} */
    #record;

    /**
     * @param {string} name
     * @param {symbol} owner
     * @param {DataRecord | null} [base]
     */
    constructor(name, owner, base)  {
        this.name = name;
        this.owner = owner;
        this.base = base || null;
        this.#record = Object.create(null, { // don't reproto to base until finalize, otherwise we'll be affected by its readonly
            [DataSnapshot_OWNER]: {value: owner},
            [DataSnapshot_NAME]: {value: name},
        });
    }

    /** @type {(prop: string) => boolean} */
    has(prop) {
        return Object.hasOwn(this.#record, prop);
    }

    /** @param {string} prop  */
    set(prop, value) {
        this.#record[prop] = value;
    }

    /** @param {string} prop  */
    delete(prop) {
        this.#record[prop] = DataSnapshot_DELETED;
    }

    /** @returns {DataRecord | null} */
    finalize() {
        Object.setPrototypeOf(this.#record, this.base);
        return Object.freeze(this.#record);
    }
}

class DeltaRecorder extends DataRecorder {
    hasChanges = false;
    /** @type {Record<string, true>} */
    foundProps = {};

    /**
     * @param {string} name
     * @param {symbol} owner
     * @param {DataRecord} base
     */
    constructor(name, owner, base)  {
        super(name, owner, base);
    }

    /** @param {string} prop  */
    set(prop, value) {
        this.foundProps[prop] = true;
        if (!(prop in this.base) || this.base[prop] !== value) {
            this.hasChanges = true;
            super.set(prop, value);
        }
    }

    delete(prop) {
        this.hasChanges = true;
        super.delete(prop);
    }

    /** @returns {DataRecord | null} */
    finalize() {
        for (const prop in this.base) {
            if (!this.foundProps[prop]) {
                this.delete(prop);
            }
        }
        findBase:
        while (this.base) {
            // seek down through the prototype stack until we find one with properties that are still exposed
            for (const prop of Object.getOwnPropertyNames(this.base)) {
                if (!this.has(prop)) {
                    break findBase;
                }
            }
            this.base = Object.getPrototypeOf(this.base);
        }
        return this.hasChanges ? super.finalize() : null;
    }
}

/** 
 * Base class for snapshots 
 * @template {*} [O=any] A generic typedef meaning "target object"
 * @implements {ReadonlyMap<O, DataRecord>}
 */
class DataSnapshot {
    /** @type {string} */
    name;
    /** @type {symbol} */
    tag;
    /** @type {number} */
    id;
    /** @type {Map<O, DataRecord>} */
    objects = new Map();
    /**
     * Map of object ids for objects contained in this snapshot
     * @type {Record<number, O>} 
     */
    idMap = {};

    /** About how much storage space does this take up? */
    sizeEstimate = 0;

    /** How many snapshots in total are required to compose this snapshot? */
    heritageLength = 1;

    #root;
    get root() { return this.#root; }

    get size() { return this.objects.size; }

    // For debug only
    get namedObjects() {
        const named = {};
        for (const v of this.objects.values()) {
            named[v[DataSnapshot_NAME]] = v;
        }
        return named;
    }

    /**
     * @protected
     * @param {String} name 
     * @param {number} [id]
     */
    constructor(name, id) {
        this.name = name;
        this.tag = Symbol(name);
        if (typeof id === "number") {
            this.id = id;
            Data.setObjectId(this, id);
        } else {
            this.id = Data.getObjectId(this);
        }
    }

    getHeritage() {
        return [this];
    }

    /** @param {O} object  */
    get(object) {
        return this.objects.get(object);
    }

    /** @param {O} object  */
    has(object) {
        return this.objects.has(object);
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    *entries() {
        yield *this.objects.entries();
    }

    /** @type {(callbackfn: (record: DataRecord, object: O, snapshot: DataSnapshot) => void, thisArg?: any) => void}   */
    forEach(callbackfn, thisArg) {
        for (const [object, record] of this.entries()) {
            callbackfn.call(thisArg, record, object, this);
        }
    }

    *keys() {
        for (const [object, _copy] of this.entries()) {
            yield object;
        }
    }

    *values() {
        for (const [_object, copy] of this.entries()) {
            yield copy;
        }
    }

    /** @param {O} object @param {string} prop */
    getValue(object, prop) {
        const copy = this.get(object);
        const value = copy[prop];
        if (value === DataSnapshot_DELETED) return undefined;
        return value;
    }

    /** @param {O} object @returns {Generator<[string, any]>} */
    *getEntries(object) {
        const record = this.get(object);
        if (!record) return;

        yield* this.getEntriesFromRecord(record);
    }

    /** @param {DataRecord} record @returns {Generator<[string, any]>} */
    *getEntriesFromRecord(record) {
        for (const prop in record) {
            const value = record[prop];
            if (value === DataSnapshot_DELETED) continue;
            yield [prop, value];
        }
    }

    /** @param {O} object */
    *getProps(object) {
        for (const [prop, _value] of this.getEntries(object)) {
            yield prop;
        }
    }

    exportIds() {
        /** @type {SnapshotIdMap} */
        const idRefs = {
            [Data.getObjectId(this)]: {
                root: Data.getObjectId(this.root)
            }
        };
        for (const [object, record] of this.objects) {
            const id = Data.getObjectId(object);
            /** @type {Record<string, number>} */
            const refs = {};
            for (const prop of Object.getOwnPropertyNames(record)) {
                const value = record[prop];
                if (value && typeof value === "object") {
                    refs[prop] = Data.getObjectId(object);
                }
            }
            idRefs[id] = refs;
        }
        return idRefs;
    }

    /** @param {SnapshotIdMap} idRefs */
    verifyIds(idRefs) {
        const rootId = idRefs[Data.getObjectId(this)]?.root;
        if (rootId !== Data.getObjectId(this.root)) {
            console.error(`Data out of sync! Our root id is ${Data.getObjectId(this.root)}, imported id is ${rootId}`, this, idRefs);
            return false;
        }
        for (const [object, record] of this.objects) {
            const id = Data.getObjectId(object);
            const refs = idRefs[id];
            if (!refs) {
                console.error(`Data out of sync! We have object ${id} but imported data does not`, this, idRefs);
                return false;
            }
            for (const prop of Object.getOwnPropertyNames(record)) {
                const value = record[prop];
                if (value && typeof value === "object") {
                    if (refs[prop] !== Data.getObjectId(object)) {
                        console.error(`Data out of sync! our ${record[DataSnapshot_NAME]}.${prop} is id ${Data.getObjectId(object)}, imported id is ${refs[prop]}`, this, idRefs, object, record);
                        return false;
                    }
                }
            }
            idRefs[id] = refs;
        }
        return true;
    }

    export() {
        /** @type {SnapshotExport} */
        const data = {
            type: this instanceof StaticSnapshot ? "static"
                : this instanceof DeltaSnapshot ? "delta"
                : (() => {throw new TypeError("Snapshot not expected type")})(),
            name: this.name,
            id: this.id,
            baseId: this instanceof DeltaSnapshot ? this.deltaBase.id : null,
            rootId: Data.getObjectId(this.#root),
            objects: {},
            idList: [],
        };
        const prototypes = {};
        for (const [object, record] of this.objects) {
            const id = Data.getObjectId(object);
            const name = record[DataSnapshot_NAME]
            data.idList.push(id);
            const values = {};
            /** @type {Record<string,number>} */
            const refs = {};
            const deleted = [];
            const prototypeId = Data.getObjectId(Object.getPrototypeOf(object));
            prototypes[prototypeId] = [name, object];
            for (const prop of Object.getOwnPropertyNames(record)) {
                const value = record[prop];
                if (value === DataSnapshot_DELETED) {
                    deleted.push(prop);
                } else if (typeof value === "function") {
                    console.error(`Cannot export function value ${record[DataSnapshot_NAME]}.${prop}`, value);
                } else if (!value || typeof value !== "object") {
                    values[prop] = value;
                } else {
                    refs[prop] = Data.getObjectId(value);
                }
            }
            data.objects[id] = {
                values,
                refs,
                deleted,
                id,
                name,
                prototypeId,
            };
        }
        // console.log(`Prototypes for ${this.id}:`,prototypes);
        return data;
    }

    /** @param {SnapshotExport} data  */
    import(data, root, finalize=true) {
        this.#root = root;
        const idMap = {
            __proto__: null,
            ...Data.wellKnownObjects,
            [data.rootId]: root,
        };
        // idMap will get extended with the ids of our base's objects if this is a DeltaSnapshot
        this.importObjects(data.objects, data.idList, idMap);
        return finalize ? this.finalize() : this;
    }

    /**
     * @param {Record<number, SnapshotExportRecord>} exportRecords
     * @param {number[]} idList 
     * @param {Record<number, object>} idMap
     */
    importObjects(exportRecords, idList, idMap) {
        // First, walk through the list and ensure all objects are listed in idMap
        for (const id of idList) {
            const exportRecord = exportRecords[id];
            let object = idMap[id];
            if (!object) {
                const prototype = idMap[exportRecord.prototypeId];
                if (!prototype) {
                    throw new TypeError(`Could not find prototype with id ${exportRecord.prototypeId}`, idMap);
                }

                if (exportRecord.prototypeId in Data.wellKnownConstructors) {
                    object = Data.wellKnownConstructors[exportRecord.prototypeId](exportRecord.values);
                } else {
                    object = {__proto__: prototype};
                }

                Data.setObjectId(object, id);
                idMap[id] = object;
            }
        }
        // Then go through again and create all the records
        let count = 0;
        for (const id of idList) {
            const exportRecord = exportRecords[id];
            const object = idMap[id];
            const recorder = this.createRecorderForImport(object, exportRecord.name);
            // record simple values
            for (const [prop, value] of Object.entries(exportRecord.values)) {
                recorder.set(prop, value);
            }
            // record deletions
            for (const prop of exportRecord.deleted) {
                recorder.delete(prop);
            }
            // record references
            for (const [prop, refId] of Object.entries(exportRecord.refs)) {
                const refObj = idMap[refId];
                if (!refObj) {
                    console.error(`Could not find referenced object with id ${refId}`, this, exportRecord, idMap);
                    throw new Error(`Could not find referenced object with id ${refId}`);
                }
                recorder.set(prop, refObj);
            }

            // add the object record
            this.objects.set(object, recorder.finalize());
            count++;
        }
        return count;
    }

    /** @protected @type {(object: O, name: string) => DataRecorder} */
    createRecorderForImport(object, name) {
        // delta objects may have a base, but they get recorded like standard objects using the DataRecorder
        return new DataRecorder(name, this.tag, this.get(object));
    }

    applySnapshot() {
        for (const [object, record] of this.objects) { // we specifically only want our own objects
            this.applyObject(object, record);
        }
    }

    applyState() {
        performance.mark("applyState-start");
        for (const [object, record] of this) {
            for (const [prop, value] of this.getEntriesFromRecord(record)) {
                if (object[prop] !== value) object[prop] = value;
            }
            const omitRecords = object[DataSnapshot_OMIT];
            for (const prop of Object.getOwnPropertyNames(object)) {
                if ((!(prop in record) || record[prop] === DataSnapshot_DELETED) && !(omitRecords?.[prop])) {
                    const descr = Object.getOwnPropertyDescriptor(object, prop);
                    if (descr.writable || !!descr.set) {
                        delete object[prop];
                    }
                }
            }
        }
        performance.mark("applyState-end");
        performance.measure("applyState", "applyState-start", "applyState-end");
    }

    /** @protected @param {O} object @param {DataRecord} record */
    applyObject(object, record) {
        for (const prop of Object.getOwnPropertyNames(record)) { // we only want modifications on our layer of the object
            const value = record[prop];
            if (value === DataSnapshot_DELETED) {
                delete object[prop];
            } else {
                object[prop] = value;
            }
        }
    }

    /** @returns {this | null} */
    finalize() {
        for (const [object, record] of this.objects) {
            this.idMap[Data.getObjectId(object)] = object;
            this.sizeEstimate += this.estimateSize(record);
        }
        Object.freeze(this);
        return this;
    }

    /** @protected @param {DataRecord} record */
    estimateSize(record) {
        // as a rough estimate, each property of each record will need a reference to its key and a reference to its value, each 64 bits
        // the idMap will need another key + value for this record at 64 bits apiece (16 bytes total)
        // add another 40 bytes for the symbol-named properties and a reference to the snapshot itself
        // whatever, it's not an exact science
        return Object.getOwnPropertyNames(record).length * 16 + 16 + 40;
    }

    /** @returns {this | null} */
    recordData(root, finalize=true) {
        this.#root = root;
        this.recordHierarchy(root, "", DataSnapshot.#getEntriesForRecord);
        
        return finalize ? this.finalize() : this;
    }

    /** @param {DataSnapshot} snapshot @returns {this | null} */
    recordFromSnapshot(snapshot, finalize=true) {
        this.#root = snapshot.#root;
        this.recordHierarchy(this.#root, "", snapshot.getEntries.bind(snapshot));

        return finalize ? this.finalize() : this;
    }

    // When recording from live data we get all the writable string-named own properties, enumerable or not
    /** @returns {Generator<[string, any, boolean]>} */
    static *#getEntriesForRecord(object) {
        const omitRecords = object[DataSnapshot_OMIT];
        for (const prop of Object.getOwnPropertyNames(object)) {
            if (omitRecords?.[prop] === true) {
                continue;
            }
            const descr  = Object.getOwnPropertyDescriptor(object, prop);
            yield ([prop, object[prop], descr.writable || !!descr.set]);
        }
    }

    /**
     * @param {O} object Key into this.objects and source of data
     * @param {string} name Hierarchical name for debug
     * @param {(object: O) => Iterable<[string, any, boolean]>} getEntries
     * @returns {number} Number of records created
     */
    recordHierarchy(object, name, getEntries) {
        let count = 0;

        for (const [o, record] of this.walkHierarchy(object, name, getEntries)) {
            if (record) {
                count++;
                this.objects.set(o, record);
            } else if (record === undefined) {
                this.objects.set(o, record);
            } else {
                this.objects.delete(o);
            }
        }

        return count;
    }

    /** @type {(object: O, name: string, getEntries: (object: O) => Iterable<[string, any, boolean]>, seen?: Set<O>) => Generator<[O, DataRecord | null]>} */
    *walkHierarchy(object, name, getEntries, seen) {
        if (!object) {
            throw new Error(`Called walkHierarchy for ${name} with falsy object ${object}`);
        }
        seen ??= new Set();
        if (seen.has(object)) {
            // console.debug(`Object ${name} has already been recorded!`, object, this.objects.get(object));
            return;
        }
        seen.add(object);

        const recorder = this.createRecorder(object, name);
        // yielding an undefined mapping to establish the map ordering
        yield [object, undefined];

        for (const [prop, value] of this.processRecord(object, recorder, getEntries)) {
            yield *this.walkHierarchy(value, Data.subkey(object, name, prop), getEntries, seen);
        }

        yield [object, recorder.finalize()];
    }

    /** @type {(object: O, recorder: DataRecorder, getEntries: (object: O) => Iterable<[string, any, boolean]>) => Generator<[string, any]>} */
    *processRecord(object, recorder, getEntries) {
        for (const [prop, value, writable] of getEntries(object)) {
            if (writable !== false) {
                recorder.set(prop, value);
            }

            if (value && typeof value === "object") {
                yield [prop, value];
            }
        }
    }

    /** @type {(base: DataSnapshot) => DeltaSnapshot} */
    createDeltaFrom(base) {
        const delta = new DeltaSnapshot(this.tag.description, base);
        return delta.recordFromSnapshot(this);
    }

    /** @returns {StaticSnapshot} */
    toStatic() {
        const snapshot = new StaticSnapshot(this.tag.description);
        return snapshot.recordFromSnapshot(this);
    }

    /** @protected @type {(object: O, name: string) => DataRecorder} */
    createRecorder(_object, name) {
        return new DataRecorder(name, this.tag, null);
    }
}

/** 
 * Snapshots recorded in full
 * @template {*} [O=any] A generic typedef meaning "target object"
 * @extends {DataSnapshot<O>}
 */
class StaticSnapshot extends DataSnapshot {
    /** @param {string} name @param {number} [id] */
    constructor(name, id) {
        super(name, id);
    }

    /**  @protected @param {O} object @param {DataRecord} copy */
    applyObject(object, copy) {
        super.applyObject(object, copy);

        // static snapshot, remove missing props
        for (const prop in object) {
            if (!(prop in copy)) {
                delete object[prop];
            }
        }
    }

    toStatic() {
        return this;
    }

    // listed here to make debug easier
    get namedObjects() {return super.namedObjects}
}

/** 
 * Snapshots recorded as a delta against a base
 * @template {*} [O=any] A generic typedef meaning "target object"
 * @extends {DataSnapshot<O>}
 */
class DeltaSnapshot extends DataSnapshot {
    /** @type {DataSnapshot<O>} */
    deltaBase;
    /** @type {DataSnapshot<O>} */
    nominalBase;

    get size() {
        let count = this.deltaBase.size;
        for (const object of this.objects.keys()) {
            if (Object.getPrototypeOf(object) === null) count++;
        }
        return count;
    }

    /**
     * @param {string} name 
     * @param {DataSnapshot<O>} deltaBase 
     * @param {number} [id]
     */
    constructor(name, deltaBase, id) {
        super(name, id);
        this.deltaBase = deltaBase;
        this.nominalBase = deltaBase;
    }

    getHeritage() {
        return [...this.deltaBase.getHeritage(), this];
    }

    get(object) {
        return super.get(object) ?? this.deltaBase.get(object);
    }

    has(object) {
        return super.has(object) || this.deltaBase.has(object);
    }

    *entries() {
        yield *super.entries();
        for (const entry of this.deltaBase ?? []) {
            if (!super.has(entry[0])) yield entry;
        }
    }

    /** @returns {this | null} */
    finalize() {
        const count = this.objects.size;
        if (!count) return null;
        this.optimizeDeltaBase();
        this.heritageLength = this.deltaBase.heritageLength + 1;
        return super.finalize();
    }

    importObjects(exportRecords, idList, idMap) {
        // extend the import idMap with any objects defined in the bases
        for (const base of this.getHeritage()) {
            Object.assign(idMap, base.idMap);
        }
        return super.importObjects(exportRecords, idList, idMap);
    }

    optimizeDeltaBase() {
        /** @type {Set<symbol>} */
        const parents = new Set();
        // get a list of all names of snapshots that parent our records
        for (const record of this.objects.values()) {
            const baseRecord = Object.getPrototypeOf(record);
            if (baseRecord) {
                parents.add(baseRecord[DataSnapshot_OWNER]);
            }
        }
        // iterate down through snapshots to see which we can discard. A snapshot is discardable if
        // (a) it doesn't have any own records that we're missing,
        // (b) it's also a DeltaSnapshot, and
        // (c) its name isn't in our parents list
        discardBases:
        while (this.deltaBase instanceof DeltaSnapshot && !parents.has(this.deltaBase.tag)) {
            for (const object of this.deltaBase.objects.keys()) {
                if (!this.objects.has(object)) {
                    break discardBases;
                }
            }
            this.deltaBase = this.deltaBase.deltaBase;
        }
        this.heritageLength = this.deltaBase.heritageLength + 1;
    }

    /** @override @type {(object: O, name: string) => DataRecorder} */
    createRecorder(object, name) {
        const base = this.deltaBase.get(object) || null;
        return new (base ? DeltaRecorder : DataRecorder)(name, this.tag, base);
    }
    
    invert(finalize=true) {
        const inverse = new DeltaSnapshot(`-${this.tag.description}`, this);
        this.objects.forEach((record, object) => inverse.#invertRecord(object, record, this.nominalBase.get(object)));
        return finalize ? inverse.finalize() : inverse;
    }

    /** @type {(object: O, record: DataRecord, baseRecord: DataRecord) => void} */
    #invertRecord(object, record, baseRecord) {
        if (baseRecord === null) {
            // this object was introduced in this delta, which means it needs no changes. Skip.
            return;
        }

        // we're good with a standard MutableRecord since we already know everything that will need changing
        const inverse = new DataRecorder(baseRecord[DataSnapshot_NAME], this.tag, record);

        for (const prop of Object.getOwnPropertyNames(record)) {
            // everything that is an own property name in record is something that has changed since base.
            if (prop in baseRecord && baseRecord[prop] !== DataSnapshot_DELETED) {
                inverse.set(prop, baseRecord[prop]);
            } else {
                inverse.delete(prop);
            }
        }

        this.objects.set(object, inverse.finalize());
    }

    /** @type {(next: DeltaSnapshot, finalize?: boolean) => DeltaSnapshot} */
    composeWith(next, finalize=true) {
        const composition = new DeltaSnapshot(`${this.tag.description}${next.tag.description.startsWith("-")?"":"+"}${next.tag.description}`, this.nominalBase);
        if (next.deltaBase === this) {
            // This is easier, we know that any object present in both only needs info from nextRecord
            // I'll do this later
        }
        for (const [object, record] of this.objects.entries()) {
            const nextRecord = next.objects.get(object);
            composition.#composeObject(object, record, nextRecord);
        }
        for (const [object, nextRecord] of next.objects.entries()) {
            if (!this.objects.has(object)) {
                composition.#composeObject(object, undefined, nextRecord);
            }
        }
        return finalize ? composition.finalize() : composition;
    }

    /** @param {DataRecord} record @param {DataRecord} nextRecord */
    #composeObject(object, record, nextRecord) {
        const baseRecord = this.nominalBase.get(object) ?? null;
        const composition = new DataRecorder(nextRecord[DataSnapshot_NAME], this.tag, baseRecord);

        // just apply all record props followed by all nextRecord props
        for (const prop of Object.getOwnPropertyNames(record ?? {})) {
            composition.set(prop, record[prop]);
        }
        for (const prop of Object.getOwnPropertyNames(nextRecord ?? {})) {
            composition.set(prop, nextRecord[prop]);
        }

        this.objects.set(object, composition.finalize());
    }

    // listed here to make debug easier
    get namedObjects() {return super.namedObjects}
}

