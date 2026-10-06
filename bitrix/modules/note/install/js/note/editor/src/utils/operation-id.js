import { Type } from 'main.core';

// The tab's name for one write it asked the server to make. It travels with the request and comes back
// in the push that reports the write, which is how the tab tells the answer to its own request from a
// write somebody else made in the meantime.
//
// 32 hex characters, because that is the only shape the server admits - anything else it reads as no
// identifier at all (DocumentController::normalizeOperationId), leaving the tab unable to recognise its
// own operation. Randomness only has to make a collision between two open tabs implausible; nothing is
// authorised by this value, and the server never stores it.
const OPERATION_ID_BYTES = 16;

function randomBytes(count: number): Uint8Array
{
	const bytes = new Uint8Array(count);
	const source = globalThis.crypto;
	if (Type.isFunction(source?.getRandomValues))
	{
		source.getRandomValues(bytes);

		return bytes;
	}

	for (let index = 0; index < count; index++)
	{
		bytes[index] = Math.floor(Math.random() * 256);
	}

	return bytes;
}

export function createOperationId(): string
{
	let id = '';
	for (const byte of randomBytes(OPERATION_ID_BYTES))
	{
		id += byte.toString(16).padStart(2, '0');
	}

	return id;
}
