/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
/// <reference types="node" />
import type { Asset } from '../bindings';
import type { ResourceRef } from '../types';
export type Algorithm = 'sha256' | 'sha384' | 'sha512';
/**
 * Calculates the SHA of a buffer or file path as base64
 */
export declare function sha(data: Buffer | string, algorithm?: Algorithm): Promise<unknown>;
export declare function labeledSha(asset: Asset, algorithm?: Algorithm): Promise<string>;
export declare function getResourceReference(asset: Asset, identifier: string | undefined, algorithm?: Algorithm): Promise<ResourceRef>;
