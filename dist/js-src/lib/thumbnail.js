/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
import sharp from 'sharp';
import { ThumbnailError } from './error';
export const defaultThumbnailOptions = {
    maxSize: 1024,
    quality: 0.8,
};
export async function createThumbnail(imageData, options) {
    try {
        const opts = Object.assign({}, defaultThumbnailOptions, options);
        const { maxSize, quality: rawQuality } = opts;
        const input = sharp(imageData);
        const { hasAlpha } = await input.metadata();
        // Support both `0.8` and `80` for `quality`
        const quality = rawQuality <= 1 ? Math.round(rawQuality * 100) : rawQuality;
        const resized = input.resize({
            width: maxSize,
            height: maxSize,
            fit: 'inside',
        });
        const output = hasAlpha
            ? resized.png({ quality })
            : resized.jpeg({ quality });
        const buffer = await output.toBuffer();
        return {
            mimeType: hasAlpha ? 'image/png' : 'image/jpeg',
            buffer,
        };
    }
    catch (err) {
        const thumbnailError = new ThumbnailError({ cause: err });
        console.warn(`Could not create thumbnail, omitting`, thumbnailError);
        return null;
    }
}
