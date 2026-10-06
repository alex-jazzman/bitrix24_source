// CRC-32/ISO-HDLC over the UTF-8 bytes of the text, as an unsigned decimal string - the very value
// PHP's crc32() returns for the same input. Two places name a text by this number and both are read on
// the server as one agreed field: the genesis claim names the markdown its baseline was rebuilt from
// (SaveYjsStateCommand), and a queue left in local storage names the baseline it belongs to.
//
// Not a hash for storage or identity: a 32-bit checksum answers "is this still the same text", which is
// the only question either place asks, and it answers it with the same arithmetic on both sides of the
// wire.
const CRC32_POLYNOMIAL = 0xEDB88320;

function buildTable(): Int32Array
{
	const table = new Int32Array(256);
	for (let index = 0; index < 256; index++)
	{
		let value = index;
		for (let bit = 0; bit < 8; bit++)
		{
			value = (value & 1) === 1 ? ((value >>> 1) ^ CRC32_POLYNOMIAL) : (value >>> 1);
		}

		table[index] = value;
	}

	return table;
}

const CRC32_TABLE = buildTable();

export function crc32Utf8(text: string): string
{
	const bytes = new TextEncoder().encode(String(text ?? ''));
	let crc = 0xFFFFFFFF;
	for (const byte of bytes)
	{
		crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xFF];
	}

	return String((crc ^ 0xFFFFFFFF) >>> 0);
}
