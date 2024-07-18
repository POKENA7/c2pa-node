/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
import { createIngredientFunction, createSign, read } from './bindings';
import { defaultThumbnailOptions, } from './lib/thumbnail';
const defaultOptions = {
    thumbnail: defaultThumbnailOptions,
};
/**
 * Creates an instance of the SDK that encompasses a set of global options
 * @param options Global options for the C2PA instance
 * @returns
 */
export function createC2pa(options) {
    const opts = Object.assign({}, defaultOptions, options);
    const signFns = createSign(opts);
    return {
        createIngredient: createIngredientFunction(opts),
        read,
        ...signFns,
    };
}
export { ManifestBuilder } from './lib/manifestBuilder';
export { SigningAlgorithm, createTestSigner, } from './lib/signer';
