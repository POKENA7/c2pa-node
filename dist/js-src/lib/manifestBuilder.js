/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ManifestBuilder_definition, _ManifestBuilder_resourceStore, _ManifestBuilder_ingredients;
import { randomUUID } from 'node:crypto';
import { IngredientHashMissingError, ManifestBuilderError } from '../lib/error';
import { getResourceReference } from './hash';
class ManifestBuilder {
    constructor(baseDefinition, options) {
        _ManifestBuilder_definition.set(this, void 0);
        _ManifestBuilder_resourceStore.set(this, {});
        _ManifestBuilder_ingredients.set(this, {});
        const localDefinition = Object.assign({}, baseDefinition);
        const providedFields = Object.keys(localDefinition);
        const missingFields = ManifestBuilder.requiredFields.filter((x) => !providedFields.includes(x));
        if (missingFields.length) {
            const cause = new Error(`Missing required fields: ${missingFields.join(', ')}`);
            throw new ManifestBuilderError({ cause });
        }
        // Append Node library to claim generator
        const claimGenerator = localDefinition.claim_generator.split(/\s+/);
        // FIXME: This should be the actual version
        claimGenerator.push(`c2pa-node/0.0.0`);
        localDefinition.claim_generator = claimGenerator.join(' ');
        __classPrivateFieldSet(this, _ManifestBuilder_definition, localDefinition, "f");
        // Create a label if not provided
        if (!this.definition.label) {
            this.definition.label = ManifestBuilder.createLabel(options?.vendor);
        }
    }
    addIngredient(input) {
        const { ingredient } = input;
        if (!ingredient.hash) {
            throw new IngredientHashMissingError(ingredient);
        }
        if (!__classPrivateFieldGet(this, _ManifestBuilder_ingredients, "f").hasOwnProperty(ingredient.hash)) {
            __classPrivateFieldGet(this, _ManifestBuilder_ingredients, "f")[ingredient.hash] = input;
        }
        return this;
    }
    async addThumbnail(thumbnail) {
        const resourceRef = await getResourceReference(thumbnail, __classPrivateFieldGet(this, _ManifestBuilder_definition, "f").label);
        __classPrivateFieldGet(this, _ManifestBuilder_definition, "f").thumbnail = resourceRef;
        __classPrivateFieldGet(this, _ManifestBuilder_resourceStore, "f")[resourceRef.identifier] = thumbnail.buffer;
    }
    static createLabel(vendor) {
        const urn = randomUUID();
        if (vendor) {
            return `${vendor.toLowerCase()}:${urn}`;
        }
        return urn;
    }
    get definition() {
        return __classPrivateFieldGet(this, _ManifestBuilder_definition, "f");
    }
    get sendableIngredients() {
        return Object.values(__classPrivateFieldGet(this, _ManifestBuilder_ingredients, "f")).map(({ ingredient, resources }) => {
            return {
                ingredient: JSON.stringify(ingredient),
                resources,
            };
        }, {});
    }
    asSendable() {
        return {
            manifest: JSON.stringify(this.definition),
            resourceStore: __classPrivateFieldGet(this, _ManifestBuilder_resourceStore, "f"),
            ingredients: this.sendableIngredients,
        };
    }
}
_ManifestBuilder_definition = new WeakMap(), _ManifestBuilder_resourceStore = new WeakMap(), _ManifestBuilder_ingredients = new WeakMap();
ManifestBuilder.requiredFields = ['claim_generator', 'format'];
export { ManifestBuilder };
