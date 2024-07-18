/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
import { CreateIngredientError, InvalidStorageOptionsError, MissingSignerError, SigningError, } from './lib/error';
import { getResourceReference, labeledSha } from './lib/hash';
import { createThumbnail } from './lib/thumbnail';
const C2PA_LIBRARY_PATH = process.env.C2PA_LIBRARY_PATH;
const bindings = require(C2PA_LIBRARY_PATH ?? '../generated/c2pa.node');
const missingErrors = [
    // No embedded or remote provenance found in the asset
    'C2pa(ProvenanceMissing)',
    // JUMBF not found
    'C2pa(JumbfNotFound)',
];
function parseSignatureInfo(manifest) {
    const info = manifest.signature_info;
    if (!info) {
        return {};
    }
    return {
        signature_info: {
            ...info,
            timeObject: typeof info.time === 'string' ? new Date(info.time) : info.time,
        },
    };
}
function createIngredientResolver(manifestStore, resourceStore) {
    return (ingredient) => {
        const relatedManifest = ingredient.active_manifest;
        const thumbnailIdentifier = ingredient.thumbnail?.identifier;
        const thumbnailResource = thumbnailIdentifier
            ? resourceStore[thumbnailIdentifier]
            : null;
        return {
            ...ingredient,
            manifest: relatedManifest
                ? manifestStore.manifests[relatedManifest]
                : null,
            thumbnail: thumbnailResource
                ? {
                    format: ingredient.thumbnail?.format ?? '',
                    data: Buffer.from(thumbnailResource.buffer),
                }
                : null,
        };
    };
}
export function resolveManifest(manifestStore, manifest, resourceStore) {
    const thumbnailIdentifier = manifest.thumbnail?.identifier;
    const thumbnailResource = thumbnailIdentifier
        ? resourceStore[thumbnailIdentifier]
        : null;
    const ingredientResolver = createIngredientResolver(manifestStore, resourceStore);
    return {
        ...manifest,
        ...parseSignatureInfo(manifest),
        ingredients: (manifest.ingredients ?? []).map(ingredientResolver),
        thumbnail: thumbnailResource
            ? {
                format: manifest.thumbnail?.format ?? '',
                data: Buffer.from(thumbnailResource.buffer),
            }
            : null,
    };
}
/**
 * Reads C2PA data from an asset
 * @param asset
 * @returns A promise containing C2PA data, if present
 */
export async function read(asset) {
    try {
        const result = await bindings.read(asset);
        const manifestStore = JSON.parse(result.manifest_store);
        const resourceStore = result.resource_store;
        const activeManifestLabel = manifestStore.active_manifest;
        const manifests = Object.keys(manifestStore.manifests).reduce((acc, label) => {
            const manifest = manifestStore.manifests[label];
            return {
                ...acc,
                [label]: resolveManifest(manifestStore, manifest, resourceStore[label]),
            };
        }, {});
        return {
            active_manifest: activeManifestLabel
                ? manifests[activeManifestLabel]
                : null,
            manifests,
            validation_status: manifestStore.validation_status ?? [],
        };
    }
    catch (err) {
        if (missingErrors.some((test) => test === err?.name)) {
            return null;
        }
        throw err;
    }
}
export const defaultSignOptions = {
    embed: true,
};
export function createSign(globalOptions) {
    return {
        /**
         * Signs a C2PA manifest and optionally embeds it in the asset
         * @param props
         * @returns
         */
        async sign(props) {
            const { asset, manifest, thumbnail, signer: customSigner, options, } = props;
            const signOptions = Object.assign({}, defaultSignOptions, options);
            const signer = customSigner ?? globalOptions.signer;
            const memoryFileTypes = ['image/jpeg', 'image/png'];
            if (!signer) {
                throw new MissingSignerError();
            }
            if (!signOptions.embed && !signOptions.remoteManifestUrl) {
                throw new InvalidStorageOptionsError();
            }
            if ('buffer' in asset && !memoryFileTypes.includes(asset.mimeType)) {
                throw new Error(`Only ${memoryFileTypes.join(', ')} files can be signed using a memory buffer.`);
            }
            try {
                const signOpts = { ...signOptions, signer };
                if (!manifest.definition.thumbnail) {
                    const thumbnailInput = 'buffer' in asset ? asset.buffer : asset.path;
                    const thumbnailAsset = 
                    // Use thumbnail if provided
                    thumbnail ||
                        // Otherwise generate one if configured to do so
                        (globalOptions.thumbnail && thumbnail !== false
                            ? await createThumbnail(thumbnailInput, globalOptions.thumbnail)
                            : null);
                    if (thumbnailAsset) {
                        await manifest.addThumbnail(thumbnailAsset);
                    }
                }
                if ('buffer' in asset) {
                    const { mimeType } = asset;
                    const assetSignOpts = { ...signOpts, format: mimeType };
                    const result = await bindings.sign(manifest.asSendable(), asset, assetSignOpts);
                    const { assetBuffer: signedAssetBuffer, manifest: signedManifest } = result;
                    const signedAsset = {
                        buffer: Buffer.from(signedAssetBuffer),
                        mimeType,
                    };
                    return {
                        signedAsset,
                        signedManifest: signedManifest
                            ? Buffer.from(signedManifest)
                            : undefined,
                    };
                }
                else {
                    const { mimeType } = asset;
                    const { outputPath } = await bindings.sign(manifest.asSendable(), asset, signOpts);
                    return {
                        signedAsset: {
                            path: outputPath,
                            mimeType,
                        },
                    };
                }
            }
            catch (err) {
                throw new SigningError({ cause: err });
            }
        },
        /**
         * Signs the bytes of a C2PA claim
         * @param props
         * @returns The CBOR bytes of COSE_Sign1 (signature box of JUMBF)
         */
        async signClaimBytes({ claim, reserveSize, signer, }) {
            try {
                const result = await bindings.sign_claim_bytes(claim, reserveSize, signer);
                return Buffer.from(result);
            }
            catch (err) {
                throw new SigningError({ cause: err });
            }
        },
    };
}
export function createIngredientFunction(options) {
    /**
     * @notExported
     * Creates a storable ingredient from an asset.
     *
     * This allows ingredient data to be extracted, optionally stored, and passed in during signing at a later time if needed.
     */
    return async function createIngredient({ asset, title, thumbnail, hash: suppliedHash, }) {
        try {
            let serializedIngredient;
            let existingResources;
            const hash = suppliedHash ??
                (await labeledSha(asset, options.ingredientHashAlgorithm));
            ({ ingredient: serializedIngredient, resources: existingResources } =
                await bindings.create_ingredient(asset));
            const ingredient = JSON.parse(serializedIngredient);
            // Separate resources out into their own object so they can be stored more easily
            const resources = Object.keys(existingResources).reduce((acc, identifier) => {
                return {
                    ...acc,
                    [identifier]: Buffer.from(existingResources[identifier]),
                };
            }, {});
            // Clear out resources since we are not using this field
            ingredient.resources = undefined;
            ingredient.title = title;
            ingredient.hash = hash;
            // Generate a thumbnail if one doesn't exist on the ingredient's manifest
            if (!ingredient.thumbnail) {
                const thumbnailInput = 'buffer' in asset ? asset.buffer : asset.path;
                const thumbnailAsset = 
                // Use thumbnail if provided
                thumbnail ||
                    // Otherwise generate one if configured to do so
                    (options.thumbnail && thumbnail !== false
                        ? await createThumbnail(thumbnailInput ?? asset, options.thumbnail)
                        : null);
                if (thumbnailAsset) {
                    const resourceRef = await getResourceReference(thumbnailAsset, ingredient.instance_id);
                    ingredient.thumbnail = resourceRef;
                    resources[resourceRef.identifier] = thumbnailAsset.buffer;
                }
            }
            return {
                ingredient,
                resources,
            };
        }
        catch (err) {
            throw new CreateIngredientError({ cause: err });
        }
    };
}
