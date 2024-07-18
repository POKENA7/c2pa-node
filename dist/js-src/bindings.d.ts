/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
/// <reference types="node" />
import type { C2paOptions, Signer } from './';
import { ManifestBuilder } from './lib/manifestBuilder';
import type { Ingredient, Manifest, ResourceStore as ManifestResourceStore, ManifestStore, SignatureInfo } from './types';
export type ResourceStore = Record<string, ManifestResourceStore>;
export interface ResolvedResource {
    format: string;
    data: Buffer | null;
}
export interface ResolvedSignatureInfo extends SignatureInfo {
    timeObject?: Date | null;
}
export interface ResolvedManifest extends Omit<Manifest, 'ingredients' | 'thumbnail'> {
    ingredients: ResolvedIngredient[];
    thumbnail: ResolvedResource | null;
    signature_info?: ResolvedSignatureInfo | null;
}
export interface ResolvedManifestStore extends Omit<ManifestStore, 'active_manifest'> {
    active_manifest: ResolvedManifest | null;
    manifests: Record<string, ResolvedManifest>;
}
export interface ResolvedIngredient extends Omit<Ingredient, 'thumbnail'> {
    manifest: Manifest | null;
    thumbnail: ResolvedResource | null;
}
export declare function resolveManifest(manifestStore: ManifestStore, manifest: Manifest, resourceStore: ManifestResourceStore): ResolvedManifest;
export interface BufferAsset {
    buffer: Buffer;
    mimeType: string;
}
export interface FileAsset {
    path: string;
    mimeType?: string;
}
/**
 * An asset that can either be in memory or on disk
 */
export type Asset = BufferAsset | FileAsset;
/**
 * Reads C2PA data from an asset
 * @param asset
 * @returns A promise containing C2PA data, if present
 */
export declare function read(asset: Asset): Promise<ResolvedManifestStore | null>;
export interface SignOptions {
    embed?: boolean;
    outputPath?: string;
    remoteManifestUrl?: string | null;
}
export type SignProps<AssetType extends Asset> = {
    manifest: ManifestBuilder;
    asset: AssetType;
    thumbnail?: BufferAsset | false;
    signer?: Signer;
    options?: SignOptions;
};
export interface SignClaimBytesProps {
    claim: Buffer;
    reserveSize: number;
    signer: Signer;
}
export interface SignOutputData<AssetType extends Asset = Asset> {
    signedAsset: AssetType;
    signedManifest?: Buffer;
}
export type SignOutput<AssetType> = AssetType extends BufferAsset ? SignOutputData<BufferAsset> : AssetType extends FileAsset ? SignOutputData<FileAsset> : never;
export declare const defaultSignOptions: SignOptions;
export declare function createSign(globalOptions: C2paOptions): {
    /**
     * Signs a C2PA manifest and optionally embeds it in the asset
     * @param props
     * @returns
     */
    sign<AssetType extends Asset>(props: SignProps<AssetType>): Promise<SignOutput<AssetType>>;
    /**
     * Signs the bytes of a C2PA claim
     * @param props
     * @returns The CBOR bytes of COSE_Sign1 (signature box of JUMBF)
     */
    signClaimBytes({ claim, reserveSize, signer, }: SignClaimBytesProps): Promise<Buffer>;
};
export type IngredientResourceStore = Record<string, Buffer>;
export interface StorableIngredient {
    ingredient: Ingredient;
    resources: IngredientResourceStore;
}
export interface CreateIngredientProps {
    asset: Asset;
    title: string;
    thumbnail?: BufferAsset | false;
    hash?: string;
}
export declare function createIngredientFunction(options: C2paOptions): ({ asset, title, thumbnail, hash: suppliedHash, }: CreateIngredientProps) => Promise<StorableIngredient>;
