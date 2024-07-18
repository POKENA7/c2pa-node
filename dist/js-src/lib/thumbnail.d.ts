/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
/// <reference types="node" />
import { BufferAsset } from '..';
export interface ThumbnailOptions {
    maxSize: number;
    quality: number;
}
export declare const defaultThumbnailOptions: ThumbnailOptions;
export declare function createThumbnail(imageData: Buffer | string, options?: ThumbnailOptions): Promise<BufferAsset | null>;
