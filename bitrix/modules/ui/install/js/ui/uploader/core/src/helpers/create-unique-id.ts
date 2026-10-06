/* eslint-disable @bitrix24/bitrix24-rules/no-typeof */

let crypto: Crypto = window.crypto || (window as any).msCrypto;
if (!crypto && typeof (globalThis as any).process === 'object')
{
	crypto = (globalThis as any).require('crypto').webcrypto;
}

export const createUniqueId = (): string => {
	return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replaceAll(/[018]/g, (part: string) => (Number(part) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(part) / 4)))).toString(16));
};
