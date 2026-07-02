export function uint8ArrayToBase64(bytes: Uint8Array): string
{
	let binary = '';
	for (const byte of bytes)
	{
		binary += String.fromCodePoint(byte);
	}

	return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array
{
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (const [i, char] of [...binary].entries())
	{
		bytes[i] = char.codePointAt(0);
	}

	return bytes;
}
