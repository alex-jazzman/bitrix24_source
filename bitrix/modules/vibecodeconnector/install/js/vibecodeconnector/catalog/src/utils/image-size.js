const HEADER_BYTES = 1024 * 1024;

export async function readImageSize(file: File): Promise<{ width: number, height: number } | null>
{
	const buffer = await file.slice(0, HEADER_BYTES).arrayBuffer();
	const view = new DataView(buffer);

	return readPngSize(view)
		?? readGifSize(view)
		?? readBmpSize(view)
		?? readWebpSize(view)
		?? readJpegSize(view);
}

function ascii(view: DataView, offset: number, length: number): string
{
	if (offset + length > view.byteLength)
	{
		return '';
	}

	let out = '';
	for (let i = 0; i < length; i++)
	{
		out += String.fromCharCode(view.getUint8(offset + i));
	}

	return out;
}

function readPngSize(view: DataView): { width: number, height: number } | null
{
	if (view.byteLength < 24 || ascii(view, 1, 3) !== 'PNG')
	{
		return null;
	}

	return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readGifSize(view: DataView): { width: number, height: number } | null
{
	if (view.byteLength < 10 || ascii(view, 0, 3) !== 'GIF')
	{
		return null;
	}

	return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
}

function readBmpSize(view: DataView): { width: number, height: number } | null
{
	if (view.byteLength < 26 || ascii(view, 0, 2) !== 'BM')
	{
		return null;
	}

	return { width: Math.abs(view.getInt32(18, true)), height: Math.abs(view.getInt32(22, true)) };
}

function readWebpSize(view: DataView): { width: number, height: number } | null
{
	if (view.byteLength < 30 || ascii(view, 0, 4) !== 'RIFF' || ascii(view, 8, 4) !== 'WEBP')
	{
		return null;
	}

	const chunk = ascii(view, 12, 4);

	if (chunk === 'VP8 ')
	{
		return { width: view.getUint16(26, true) & 0x3FFF, height: view.getUint16(28, true) & 0x3FFF };
	}

	if (chunk === 'VP8L')
	{
		const bits = view.getUint32(21, true);

		return { width: (bits & 0x3FFF) + 1, height: ((bits >> 14) & 0x3FFF) + 1 };
	}

	if (chunk === 'VP8X')
	{
		const width = view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16);
		const height = view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16);

		return { width: width + 1, height: height + 1 };
	}

	return null;
}

function readJpegSize(view: DataView): { width: number, height: number } | null
{
	if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8)
	{
		return null;
	}

	let offset = 2;
	while (offset + 9 < view.byteLength)
	{
		if (view.getUint8(offset) !== 0xFF)
		{
			offset++;

			continue;
		}

		const marker = view.getUint8(offset + 1);

		if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC)
		{
			return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
		}

		if (marker === 0xFF || (marker >= 0xD0 && marker <= 0xD9))
		{
			offset += marker === 0xFF ? 1 : 2;

			continue;
		}

		if (marker === 0xDA)
		{
			return null;
		}

		offset += 2 + view.getUint16(offset + 2);
	}

	return null;
}
