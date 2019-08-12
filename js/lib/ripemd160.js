"use strict";
/*! noble-ripemd160 - MIT License (c) Paul Miller (paulmillr.com) */
Object.defineProperty(exports, "__esModule", { value: true });
const BLOCK_SIZE = 64;
const OUTPUT_SIZE = 20;
const DEFAULT_H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
const f1 = (x, y, z) => x ^ y ^ z;
const f2 = (x, y, z) => (x & y) | (~x & z);
const f3 = (x, y, z) => (x | ~y) ^ z;
const f4 = (x, y, z) => (x & z) | (y & ~z);
const f5 = (x, y, z) => x ^ (y | ~z);
const rol = (x, i) => (x << i) | (x >>> (32 - i));
const slice = (arr, start = 0, end = arr.length) => {
    if (arr instanceof Uint32Array) {
        return arr.slice(start, end);
    }
    const result = new Uint32Array(end - start);
    for (let i = start, j = 0; i < end; i++, j++) {
        result[j] = Number(arr[i]);
    }
    return result;
};
const readLE32 = (ptr, padding = 0) => (Number(ptr[padding + 3]) << 24) |
    (Number(ptr[padding + 2]) << 16) |
    (Number(ptr[padding + 1]) << 8) |
    Number(ptr[padding]);
const writeLE32 = (ptr, padding, x) => {
    ptr[padding + 3] = x >>> 24;
    ptr[padding + 2] = x >>> 16;
    ptr[padding + 1] = x >>> 8;
    ptr[padding] = x >>> 0;
};
const writeLE64 = (ptr, padding, x) => {
    x = BigInt(x);
    ptr[padding + 7] = x >> 56n;
    ptr[padding + 6] = x >> 48n;
    ptr[padding + 5] = x >> 40n;
    ptr[padding + 4] = x >> 32n;
    ptr[padding + 3] = x >> 24n;
    ptr[padding + 2] = x >> 16n;
    ptr[padding + 1] = x >> 8n;
    ptr[padding] = x;
};
const Round = (a, b, c, d, e, f, x, k, r) => new Uint32Array([rol(a + f + x + k, r) + e, rol(c, 10)]);
const R11 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f1(b, c, d), x, 0, r);
const R21 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f2(b, c, d), x, 0x5a827999, r);
const R31 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f3(b, c, d), x, 0x6ed9eba1, r);
const R41 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f4(b, c, d), x, 0x8f1bbcdc, r);
const R51 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f5(b, c, d), x, 0xa953fd4e, r);
const R12 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f5(b, c, d), x, 0x50a28be6, r);
const R22 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f4(b, c, d), x, 0x5c4dd124, r);
const R32 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f3(b, c, d), x, 0x6d703ef3, r);
const R42 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f2(b, c, d), x, 0x7a6d76e9, r);
const R52 = (a, b, c, d, e, x, r) => Round(a, b, c, d, e, f1(b, c, d), x, 0, r);
function getBinaryFromString(str) {
    const len = str.length;
    const result = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
}
class Ripemd160 {
    constructor(h = new Uint32Array(DEFAULT_H), bytes = 0, buffer = new Uint32Array(BLOCK_SIZE)) {
        this.h = h;
        this.bytes = bytes;
        this.buffer = buffer;
    }
    input(str) {
        const input = getBinaryFromString(str);
        this.write(input, input.length);
    }
    processBlock(chunk) {
        const s = this.h;
        let a1 = s[0], b1 = s[1], c1 = s[2], d1 = s[3], e1 = s[4];
        let a2 = a1, b2 = b1, c2 = c1, d2 = d1, e2 = e1;
        let w0 = readLE32(chunk, 0), w1 = readLE32(chunk, 4), w2 = readLE32(chunk, 8), w3 = readLE32(chunk, 12);
        let w4 = readLE32(chunk, 16), w5 = readLE32(chunk, 20), w6 = readLE32(chunk, 24), w7 = readLE32(chunk, 28);
        let w8 = readLE32(chunk, 32), w9 = readLE32(chunk, 36), w10 = readLE32(chunk, 40), w11 = readLE32(chunk, 44);
        let w12 = readLE32(chunk, 48), w13 = readLE32(chunk, 52), w14 = readLE32(chunk, 56), w15 = readLE32(chunk, 60);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w0, 11);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w5, 8);
        [e1, b1] = R11(e1, a1, b1, c1, d1, w1, 14);
        [e2, b2] = R12(e2, a2, b2, c2, d2, w14, 9);
        [d1, a1] = R11(d1, e1, a1, b1, c1, w2, 15);
        [d2, a2] = R12(d2, e2, a2, b2, c2, w7, 9);
        [c1, e1] = R11(c1, d1, e1, a1, b1, w3, 12);
        [c2, e2] = R12(c2, d2, e2, a2, b2, w0, 11);
        [b1, d1] = R11(b1, c1, d1, e1, a1, w4, 5);
        [b2, d2] = R12(b2, c2, d2, e2, a2, w9, 13);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w5, 8);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w2, 15);
        [e1, b1] = R11(e1, a1, b1, c1, d1, w6, 7);
        [e2, b2] = R12(e2, a2, b2, c2, d2, w11, 15);
        [d1, a1] = R11(d1, e1, a1, b1, c1, w7, 9);
        [d2, a2] = R12(d2, e2, a2, b2, c2, w4, 5);
        [c1, e1] = R11(c1, d1, e1, a1, b1, w8, 11);
        [c2, e2] = R12(c2, d2, e2, a2, b2, w13, 7);
        [b1, d1] = R11(b1, c1, d1, e1, a1, w9, 13);
        [b2, d2] = R12(b2, c2, d2, e2, a2, w6, 7);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w10, 14);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w15, 8);
        [e1, b1] = R11(e1, a1, b1, c1, d1, w11, 15);
        [e2, b2] = R12(e2, a2, b2, c2, d2, w8, 11);
        [d1, a1] = R11(d1, e1, a1, b1, c1, w12, 6);
        [d2, a2] = R12(d2, e2, a2, b2, c2, w1, 14);
        [c1, e1] = R11(c1, d1, e1, a1, b1, w13, 7);
        [c2, e2] = R12(c2, d2, e2, a2, b2, w10, 14);
        [b1, d1] = R11(b1, c1, d1, e1, a1, w14, 9);
        [b2, d2] = R12(b2, c2, d2, e2, a2, w3, 12);
        [a1, c1] = R11(a1, b1, c1, d1, e1, w15, 8);
        [a2, c2] = R12(a2, b2, c2, d2, e2, w12, 6);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w7, 7);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w6, 9);
        [d1, a1] = R21(d1, e1, a1, b1, c1, w4, 6);
        [d2, a2] = R22(d2, e2, a2, b2, c2, w11, 13);
        [c1, e1] = R21(c1, d1, e1, a1, b1, w13, 8);
        [c2, e2] = R22(c2, d2, e2, a2, b2, w3, 15);
        [b1, d1] = R21(b1, c1, d1, e1, a1, w1, 13);
        [b2, d2] = R22(b2, c2, d2, e2, a2, w7, 7);
        [a1, c1] = R21(a1, b1, c1, d1, e1, w10, 11);
        [a2, c2] = R22(a2, b2, c2, d2, e2, w0, 12);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w6, 9);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w13, 8);
        [d1, a1] = R21(d1, e1, a1, b1, c1, w15, 7);
        [d2, a2] = R22(d2, e2, a2, b2, c2, w5, 9);
        [c1, e1] = R21(c1, d1, e1, a1, b1, w3, 15);
        [c2, e2] = R22(c2, d2, e2, a2, b2, w10, 11);
        [b1, d1] = R21(b1, c1, d1, e1, a1, w12, 7);
        [b2, d2] = R22(b2, c2, d2, e2, a2, w14, 7);
        [a1, c1] = R21(a1, b1, c1, d1, e1, w0, 12);
        [a2, c2] = R22(a2, b2, c2, d2, e2, w15, 7);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w9, 15);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w8, 12);
        [d1, a1] = R21(d1, e1, a1, b1, c1, w5, 9);
        [d2, a2] = R22(d2, e2, a2, b2, c2, w12, 7);
        [c1, e1] = R21(c1, d1, e1, a1, b1, w2, 11);
        [c2, e2] = R22(c2, d2, e2, a2, b2, w4, 6);
        [b1, d1] = R21(b1, c1, d1, e1, a1, w14, 7);
        [b2, d2] = R22(b2, c2, d2, e2, a2, w9, 15);
        [a1, c1] = R21(a1, b1, c1, d1, e1, w11, 13);
        [a2, c2] = R22(a2, b2, c2, d2, e2, w1, 13);
        [e1, b1] = R21(e1, a1, b1, c1, d1, w8, 12);
        [e2, b2] = R22(e2, a2, b2, c2, d2, w2, 11);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w3, 11);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w15, 9);
        [c1, e1] = R31(c1, d1, e1, a1, b1, w10, 13);
        [c2, e2] = R32(c2, d2, e2, a2, b2, w5, 7);
        [b1, d1] = R31(b1, c1, d1, e1, a1, w14, 6);
        [b2, d2] = R32(b2, c2, d2, e2, a2, w1, 15);
        [a1, c1] = R31(a1, b1, c1, d1, e1, w4, 7);
        [a2, c2] = R32(a2, b2, c2, d2, e2, w3, 11);
        [e1, b1] = R31(e1, a1, b1, c1, d1, w9, 14);
        [e2, b2] = R32(e2, a2, b2, c2, d2, w7, 8);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w15, 9);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w14, 6);
        [c1, e1] = R31(c1, d1, e1, a1, b1, w8, 13);
        [c2, e2] = R32(c2, d2, e2, a2, b2, w6, 6);
        [b1, d1] = R31(b1, c1, d1, e1, a1, w1, 15);
        [b2, d2] = R32(b2, c2, d2, e2, a2, w9, 14);
        [a1, c1] = R31(a1, b1, c1, d1, e1, w2, 14);
        [a2, c2] = R32(a2, b2, c2, d2, e2, w11, 12);
        [e1, b1] = R31(e1, a1, b1, c1, d1, w7, 8);
        [e2, b2] = R32(e2, a2, b2, c2, d2, w8, 13);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w0, 13);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w12, 5);
        [c1, e1] = R31(c1, d1, e1, a1, b1, w6, 6);
        [c2, e2] = R32(c2, d2, e2, a2, b2, w2, 14);
        [b1, d1] = R31(b1, c1, d1, e1, a1, w13, 5);
        [b2, d2] = R32(b2, c2, d2, e2, a2, w10, 13);
        [a1, c1] = R31(a1, b1, c1, d1, e1, w11, 12);
        [a2, c2] = R32(a2, b2, c2, d2, e2, w0, 13);
        [e1, b1] = R31(e1, a1, b1, c1, d1, w5, 7);
        [e2, b2] = R32(e2, a2, b2, c2, d2, w4, 7);
        [d1, a1] = R31(d1, e1, a1, b1, c1, w12, 5);
        [d2, a2] = R32(d2, e2, a2, b2, c2, w13, 5);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w1, 11);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w8, 15);
        [b1, d1] = R41(b1, c1, d1, e1, a1, w9, 12);
        [b2, d2] = R42(b2, c2, d2, e2, a2, w6, 5);
        [a1, c1] = R41(a1, b1, c1, d1, e1, w11, 14);
        [a2, c2] = R42(a2, b2, c2, d2, e2, w4, 8);
        [e1, b1] = R41(e1, a1, b1, c1, d1, w10, 15);
        [e2, b2] = R42(e2, a2, b2, c2, d2, w1, 11);
        [d1, a1] = R41(d1, e1, a1, b1, c1, w0, 14);
        [d2, a2] = R42(d2, e2, a2, b2, c2, w3, 14);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w8, 15);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w11, 14);
        [b1, d1] = R41(b1, c1, d1, e1, a1, w12, 9);
        [b2, d2] = R42(b2, c2, d2, e2, a2, w15, 6);
        [a1, c1] = R41(a1, b1, c1, d1, e1, w4, 8);
        [a2, c2] = R42(a2, b2, c2, d2, e2, w0, 14);
        [e1, b1] = R41(e1, a1, b1, c1, d1, w13, 9);
        [e2, b2] = R42(e2, a2, b2, c2, d2, w5, 6);
        [d1, a1] = R41(d1, e1, a1, b1, c1, w3, 14);
        [d2, a2] = R42(d2, e2, a2, b2, c2, w12, 9);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w7, 5);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w2, 12);
        [b1, d1] = R41(b1, c1, d1, e1, a1, w15, 6);
        [b2, d2] = R42(b2, c2, d2, e2, a2, w13, 9);
        [a1, c1] = R41(a1, b1, c1, d1, e1, w14, 8);
        [a2, c2] = R42(a2, b2, c2, d2, e2, w9, 12);
        [e1, b1] = R41(e1, a1, b1, c1, d1, w5, 6);
        [e2, b2] = R42(e2, a2, b2, c2, d2, w7, 5);
        [d1, a1] = R41(d1, e1, a1, b1, c1, w6, 5);
        [d2, a2] = R42(d2, e2, a2, b2, c2, w10, 15);
        [c1, e1] = R41(c1, d1, e1, a1, b1, w2, 12);
        [c2, e2] = R42(c2, d2, e2, a2, b2, w14, 8);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w4, 9);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w12, 8);
        [a1, c1] = R51(a1, b1, c1, d1, e1, w0, 15);
        [a2, c2] = R52(a2, b2, c2, d2, e2, w15, 5);
        [e1, b1] = R51(e1, a1, b1, c1, d1, w5, 5);
        [e2, b2] = R52(e2, a2, b2, c2, d2, w10, 12);
        [d1, a1] = R51(d1, e1, a1, b1, c1, w9, 11);
        [d2, a2] = R52(d2, e2, a2, b2, c2, w4, 9);
        [c1, e1] = R51(c1, d1, e1, a1, b1, w7, 6);
        [c2, e2] = R52(c2, d2, e2, a2, b2, w1, 12);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w12, 8);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w5, 5);
        [a1, c1] = R51(a1, b1, c1, d1, e1, w2, 13);
        [a2, c2] = R52(a2, b2, c2, d2, e2, w8, 14);
        [e1, b1] = R51(e1, a1, b1, c1, d1, w10, 12);
        [e2, b2] = R52(e2, a2, b2, c2, d2, w7, 6);
        [d1, a1] = R51(d1, e1, a1, b1, c1, w14, 5);
        [d2, a2] = R52(d2, e2, a2, b2, c2, w6, 8);
        [c1, e1] = R51(c1, d1, e1, a1, b1, w1, 12);
        [c2, e2] = R52(c2, d2, e2, a2, b2, w2, 13);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w3, 13);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w13, 6);
        [a1, c1] = R51(a1, b1, c1, d1, e1, w8, 14);
        [a2, c2] = R52(a2, b2, c2, d2, e2, w14, 5);
        [e1, b1] = R51(e1, a1, b1, c1, d1, w11, 11);
        [e2, b2] = R52(e2, a2, b2, c2, d2, w0, 15);
        [d1, a1] = R51(d1, e1, a1, b1, c1, w6, 8);
        [d2, a2] = R52(d2, e2, a2, b2, c2, w3, 13);
        [c1, e1] = R51(c1, d1, e1, a1, b1, w15, 5);
        [c2, e2] = R52(c2, d2, e2, a2, b2, w9, 11);
        [b1, d1] = R51(b1, c1, d1, e1, a1, w13, 6);
        [b2, d2] = R52(b2, c2, d2, e2, a2, w11, 11);
        const t = s[0];
        s[0] = s[1] + c1 + d2;
        s[1] = s[2] + d1 + e2;
        s[2] = s[3] + e1 + a2;
        s[3] = s[4] + a1 + b2;
        s[4] = t + b1 + c2;
    }
    write(data, len) {
        let bufsize = this.bytes % 64;
        let padding = 0;
        if (bufsize && bufsize + len >= BLOCK_SIZE) {
            this.buffer.set(slice(data, 0, BLOCK_SIZE - bufsize), bufsize);
            this.bytes += BLOCK_SIZE - bufsize;
            padding += BLOCK_SIZE - bufsize;
            this.processBlock(this.buffer);
            bufsize = 0;
        }
        while (len - padding >= 64) {
            this.processBlock(slice(data, padding, padding + BLOCK_SIZE));
            this.bytes += BLOCK_SIZE;
            padding += BLOCK_SIZE;
        }
        if (len > padding) {
            this.buffer.set(slice(data, padding, len), bufsize);
            this.bytes += len - padding;
        }
    }
    result() {
        const { h, bytes } = this;
        const pad = new Uint32Array(BLOCK_SIZE);
        const hash = new Uint32Array(OUTPUT_SIZE);
        pad[0] = 0x80;
        const sizedesc = new Array(8);
        writeLE64(sizedesc, 0, bytes << 3);
        this.write(pad, 1 + ((119 - (bytes % 64)) % 64));
        this.write(sizedesc, 8);
        writeLE32(hash, 0, h[0]);
        writeLE32(hash, 4, h[1]);
        writeLE32(hash, 8, h[2]);
        writeLE32(hash, 12, h[3]);
        writeLE32(hash, 16, h[4]);
        return hash;
    }
}
function u32to8(u32) {
    const u8 = new Uint8Array(u32.length);
    for (let i = 0; i < u32.length; i++) {
        const hs = (u32[i] & 255).toString(16);
        u8[i] = parseInt(`0${hs}`.slice(-2), 16);
    }
    return u8;
}
function toHex(uint8a) {
    return Array.from(uint8a).map(c => c.toString(16).padStart(2, '0')).join('');
}
function ripemd160(message) {
    const hasher = new Ripemd160();
    if (typeof message === "string") {
        hasher.input(message);
    }
    else {
        hasher.write(message, message.length);
    }
    const hash = u32to8(hasher.result());
    return typeof message === "string" ? toHex(hash) : hash;
}
exports.default = ripemd160;
