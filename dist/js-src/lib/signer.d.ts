/**
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it.
 */
/// <reference types="node" />
export declare enum SigningAlgorithm {
    ES256 = "es256",
    ES384 = "es384",
    ES512 = "es512",
    PS256 = "ps256",
    PS384 = "ps384",
    PS512 = "ps512",
    Ed25519 = "ed25519"
}
export interface LocalSigner {
    type: 'local';
    certificate: Buffer;
    privateKey: Buffer;
    algorithm?: SigningAlgorithm;
    tsaUrl?: string;
}
export interface SignInput {
    reserveSize: number;
    toBeSigned: Buffer;
}
export interface RemoteSigner {
    type: 'remote';
    reserveSize: () => Promise<number>;
    sign: (input: SignInput) => Promise<Buffer>;
}
export type Signer = LocalSigner | RemoteSigner;
interface TestSignerOptions {
    certificatePath: string;
    privateKeyPath: string;
}
export declare function createTestSigner({ certificatePath, privateKeyPath, }?: TestSignerOptions): Promise<LocalSigner>;
export {};
