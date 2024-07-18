/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
/// <reference types="node" />
import type { BufferAsset, StorableIngredient } from '..';
import type { Manifest } from '../types';
type RequiredFields = Required<Pick<Manifest, 'claim_generator' | 'format'>>;
export type ManifestDefinition = Partial<Omit<Manifest, 'signature_info'>> & RequiredFields;
export type BaseManifestDefinition = Omit<ManifestDefinition, 'thumbnail' | 'ingredients'> & RequiredFields;
export type ManifestBuilderOptions = {
    vendor?: string;
};
export declare class ManifestBuilder {
    #private;
    static requiredFields: string[];
    constructor(baseDefinition: BaseManifestDefinition, options?: ManifestBuilderOptions);
    addIngredient(input: StorableIngredient): this;
    addThumbnail(thumbnail: BufferAsset): Promise<void>;
    static createLabel(vendor?: string): string;
    get definition(): ManifestDefinition;
    get sendableIngredients(): {
        ingredient: string;
        resources: import("..").IngredientResourceStore;
    }[];
    asSendable(): {
        manifest: string;
        resourceStore: Record<string, Buffer>;
        ingredients: {
            ingredient: string;
            resources: import("..").IngredientResourceStore;
        }[];
    };
}
export {};
