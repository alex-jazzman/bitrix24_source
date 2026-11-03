import { Type } from 'main.core';

const DEFAULT_STAGE_COLOR = '22d3ee';
const HEX_COLOR_PATTERN = /^#?([\da-f]{6})$/i;
const SHORT_HEX_COLOR_PATTERN = /^#?([\da-f]{3})$/i;

function normalizeHexColor(color: unknown): string | null
{
	if (!Type.isString(color))
	{
		return null;
	}

	return color.match(HEX_COLOR_PATTERN)?.[1].toLowerCase() ?? null;
}

// Three-digit hex is not a storable stage color, but text on it still has to be readable.
function expandShortHexColor(color: unknown): string | null
{
	if (!Type.isString(color))
	{
		return null;
	}

	const shortColor = color.match(SHORT_HEX_COLOR_PATTERN)?.[1].toLowerCase();

	return shortColor ? [...shortColor].map((channel) => channel.repeat(2)).join('') : null;
}

function getRelativeLuminance(color: string): number
{
	const channels = [
		color.slice(0, 2),
		color.slice(2, 4),
		color.slice(4, 6),
	]
		.map((channel) => Number.parseInt(channel, 16) / 255)
		.map((channel) => (
			channel <= 0.04045
				? channel / 12.92
				: ((channel + 0.055) / 1.055) ** 2.4
		))
	;

	return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

export function normalizeStageColor(color: unknown, fallback?: string): string
{
	return normalizeHexColor(color) ?? normalizeHexColor(fallback) ?? DEFAULT_STAGE_COLOR;
}

export function getDefaultStageColor(): string
{
	return DEFAULT_STAGE_COLOR;
}

export function getStageTextColor(color: unknown): '#000000' | '#ffffff'
{
	const luminance = getRelativeLuminance(
		normalizeHexColor(color) ?? expandShortHexColor(color) ?? DEFAULT_STAGE_COLOR,
	);
	const blackContrastRatio = (luminance + 0.05) / 0.05;
	const whiteContrastRatio = 1.05 / (luminance + 0.05);

	return blackContrastRatio >= whiteContrastRatio ? '#000000' : '#ffffff';
}
