import { Loc, Type } from 'main.core';

const UNIT_MESSAGE_KEYS: readonly string[] = Object.freeze([
	'DISK_PICKER_SIZE_UNIT_BYTES',
	'DISK_PICKER_SIZE_UNIT_KB',
	'DISK_PICKER_SIZE_UNIT_MB',
	'DISK_PICKER_SIZE_UNIT_GB',
	'DISK_PICKER_SIZE_UNIT_TB',
]);

const STEP = 1024;
const DECIMAL_SEPARATOR = ',';

function formatNumber(value: number, fractionDigits: number): string
{
	return value.toFixed(fractionDigits).replace('.', DECIMAL_SEPARATOR);
}

// Formats a byte count into a compact human-readable size. A missing size
// (folders, files without a known size) yields an empty string.
export function formatSize(bytes: number | null): string
{
	if (!Type.isNumber(bytes) || bytes < 0)
	{
		return '';
	}

	let value = bytes;
	let unitIndex = 0;
	while (value >= STEP && unitIndex < UNIT_MESSAGE_KEYS.length - 1)
	{
		value /= STEP;
		unitIndex += 1;
	}

	const fractionDigits = unitIndex === 0 || Number.isInteger(value) ? 0 : 1;
	const number = formatNumber(value, fractionDigits);
	const unit = Loc.getMessage(UNIT_MESSAGE_KEYS[unitIndex]) ?? '';

	return unit === '' ? number : `${number} ${unit}`;
}
