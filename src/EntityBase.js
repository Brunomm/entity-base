import {
  isBlank,
  humanizeString,
  createUUID
} from './utils.js'

import Errors from './Errors'

const fixedProperties = {
  _token: null,
  _is_checked: false,
  _destroy: false,
  _created_at: null,
  errors: null,
  id: null,
  updated_at: null,
  created_at: null
};

function getOrConvertToInstance(klass, params) {
  if (!params) return null;
  if (params instanceof klass) return params

  const obj = new klass(params);
  return typeof obj === 'function' ? new obj(params) : obj;
}

function manageHasManyValue(klass, _key, value) {
  const collection = new Map();

  if (!value) return collection;

  const arr = Array.isArray(value)
    ? value
    : value instanceof Map
    ? Array.from(value.values())
    : Object.values(value)

  for (const item of arr) {
    const entity = getOrConvertToInstance(klass, item);
    collection.set(entity.idOrToken, entity);
  }

  return collection;
}

function definePropertyGetters(instance) {
  for (const key of Object.keys(instance.constructor?.defaultAttributes || {})) {
    if (!(key in instance)) {
      Object.defineProperty(instance, key, {
        get: () => instance.get(key),
        enumerable: false,
        configurable: true
      });
    }
  }
}

class EntityBase {
  static defaultAttributes = {};
  static primaryKey = 'id';
  static belongsTo = {};
  static hasMany = {};
  static validates = {};

  static get defaultProperties() {
    return { ...fixedProperties, ...this.defaultAttributes };
  }

  static get attributeNames() {
    return {};
  }

  static hummanAttributeName(attr) {
    if (attr === 'base') return '';
    return this.attributeNames[attr] || humanizeString(String(attr));
  }

  constructor(args = {}) {
    const input = {
      ...this.constructor.defaultProperties,
      ...(isBlank(args) ? {} : args)
    };

    input._token = createUUID();
    input._created_at = input._created_at || new Date();
    input.errors = new Errors(this.constructor);

    // Separar atributos comuns de relacionamentos
    this._attributes = {};
    this._relations = {};

    for (const key in input) {
      if (this.isBelongsTo(key)) {
        this._relations[key] = getOrConvertToInstance(this._belongsTo[key], input[key]);
      } else if (this.isHasMany(key)) {
        this._relations[key] = manageHasManyValue(this._hasMany[key], key, input[key]);
      } else {
        this._attributes[key] = input[key];
      }
    }

    definePropertyGetters(this)
  }

  get _belongsTo() {
    return this.constructor.belongsTo;
  }

  get _hasMany() {
    return this.constructor.hasMany;
  }

  get belongsToKeys() {
    return Object.keys(this._belongsTo);
  }

  get hasManyKeys() {
    return Object.keys(this._hasMany);
  }

  get primaryKey() {
    return this.constructor.primaryKey;
  }

  get idOrToken() {
    return this.entityID || this.get('_token');
  }

  get entityID() {
    return this.get(this.primaryKey);
  }

  get validations() {
    return this.constructor.validates;
  }

  get(attr) {
    if (this.isBelongsTo(attr) || this.isHasMany(attr)) {
      return this._relations[attr];
    }
    return this._attributes[attr];
  }

  set(key, val, defineGetters = true) {
    if (this._attributes[key] === val) return this;

    if (this.isBelongsTo(key)) {
      const newRelations = { ...this._relations, [key]: getOrConvertToInstance(this._belongsTo[key], val) };
      const newInstance = this._clone(this._attributes, newRelations);

      if(defineGetters) { definePropertyGetters(newInstance) }

      return newInstance
    }

    if (this.isHasMany(key)) {
      const newRelations = { ...this._relations, [key]: manageHasManyValue(this._hasMany[key], key, val) };
      const newInstance = this._clone(this._attributes, newRelations);
      if(defineGetters) { definePropertyGetters(newInstance) }

      return newInstance;
    }

    const newAttributes = { ...this._attributes, [key]: val };

    const newInstance = this._clone(newAttributes, this._relations);
    if(defineGetters) { definePropertyGetters(newInstance) }

    return newInstance
  }

  updateAttributes(newAttrs = {}) {
    let updated = this;
    for (const key of Object.keys(newAttrs)) {
      updated = updated.set(key, newAttrs[key], false);
    }

    definePropertyGetters(updated)
    return updated;
  }

  addNested(relationName, newAttrs = {}) {
    const relationInstances = this.get(relationName);
    const newRelationInstance = new this._hasMany[relationName](newAttrs)

    const newRelationInstances = new Map(this.get(relationName));
    newRelationInstances.set(newRelationInstance.idOrToken, newRelationInstance);

    return [
      this.set(relationName, newRelationInstances),
      newRelationInstance
    ];
  }

  updateNested(relationName, relationKey, newAttrs = {}) {
    const relationInstance = this.get(relationName).get(relationKey);
    if(isBlank(relationInstance)) throw 'invalid relation key'
    if(isBlank(newAttrs)) return this

    const updatedRelationInstance = relationInstance.updateAttributes(newAttrs)

    const newRelationInstances = new Map(this.get(relationName));
    newRelationInstances.set(relationKey, updatedRelationInstance);

    return [
      this.set(relationName, newRelationInstances),
      updatedRelationInstance
    ];
  }

  updateManyNested(relationName, newAttrs = {}, relationKeys = null) {
    if(isBlank(newAttrs)) return this

    let newInstances = new Map()
    let changedInstances = []
    for (const relInstance of Array.from(this.get(relationName).values())) {
      let newInstance = relInstance

      if (isBlank(relationKeys) || relationKeys.includes(relInstance.idOrToken)) {
        newInstance = newInstance.updateAttributes(newAttrs)
        changedInstances = [...changedInstances, newInstance]
      }

      newInstances.set(relInstance.idOrToken, newInstance)
    }

    return [this.set(relationName, newInstances), changedInstances];
  }

  array(relationName) {
    return Array.from(this.get(relationName).values())
  }

  toObject() {
    return {
      ...this._attributes,
      ...this._relations
    };
  }

  toParams() {
    const selfInstance = this
    return {
      ...this._attributes,
      ...Object.fromEntries(Object.keys(selfInstance._relations).map( key => {
        if (selfInstance.isHasMany(key)) {
          return [
            key,
            selfInstance.array(key).map( relInstance => relInstance.toParams() )
          ]

        } else {
          return [key, selfInstance.get(key).toParams()]
        }
      }))
    };
  }

  isBelongsTo(key) {
    return this.belongsToKeys.includes(key);
  }

  isHasMany(key) {
    return this.hasManyKeys.includes(key);
  }

  isNewEntity() {
    return isBlank(this.get(this.primaryKey));
  }

  isPersisted() {
    return !this.isNewEntity();
  }

  validate() {
    const errors = this.get('errors').clone();
    errors.clear();

    const currentInstance = this

    Object.entries(this.validations).forEach(([attr, rules]) => {
      rules.forEach((ruleFn) => {
        const state = ruleFn(currentInstance.get(attr), currentInstance);
        if (!state.isValid) {
          errors.add(attr, state.message);
        }
      });
    });

    return this.set('errors', errors);
  }

  isValid() {
    return this.get('errors').isEmpty();
  }

  _clone(newAttributes, newRelations) {
    const clone = Object.create(this.constructor.prototype);
    clone._attributes = newAttributes;
    clone._relations = newRelations;
    return clone;
  }
}

export default EntityBase
