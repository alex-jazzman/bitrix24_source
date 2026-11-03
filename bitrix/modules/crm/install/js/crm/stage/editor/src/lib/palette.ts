import { Type } from 'main.core';
import {
	getDefaultStageColor,
	normalizeStageColor as normalizeSharedStageColor,
} from 'crm.stage.color';

export const StageEditorPaletteRows = Object.freeze({
	Row100: '100',
	Row200: '200',
	Row300: '300',
	Row400: '400',
	Row600: '600',
	Row800: '800',
});

export const StageEditorPalette: ReadonlyArray<ReadonlyArray<string>> = Object.freeze([
	Object.freeze([
		'ffe4e6', 'ffe2d6', 'ffedd5', 'fef3c7', 'ecf8c8', 'dcfce7', 'd1fae5',
		'ccfbf1', 'cffafe', 'dbeafe', 'e0e7ff', 'ede9fe', 'fce7f3', 'f1f5f9',
	]),
	Object.freeze([
		'fecdd3', 'ffc6ad', 'fed7aa', 'fde68a', 'd8ee8e', 'bbf7d0', 'a7f3d0',
		'99f6e4', 'a5f3fc', 'bfdbfe', 'c7d2fe', 'ddd6fe', 'fbcfe8', 'e2e8f0',
	]),
	Object.freeze([
		'fd9fac', 'ffa385', 'fdb573', 'fcd357', 'beda69', '83eba8', '6ee3b5',
		'63e5d2', '64e3f5', '90c0fc', 'a4affb', 'c2b1fc', 'f8a1cf', 'bbc6d4',
	]),
	Object.freeze([
		'fb7185', 'ff805d', 'fb923c', 'fbbf24', 'a3c644', '4ade80', '34d399',
		'2dd4bf', '22d3ee', '60a5fa', '818cf8', 'a78bfa', 'f472b6', '94a3b8',
	]),
	Object.freeze([
		'e11d48', 'd9471f', 'ea580c', 'b7791f', '5f7f1f', '16a34a', '059669',
		'0d9488', '0891b2', '2563eb', '4f46e5', '7c3aed', 'db2777', '64748b',
	]),
	Object.freeze([
		'9f1239', '8f2d13', '9a3412', '78350f', '365314', '166534', '065f46',
		'115e59', '155e75', '1e40af', '3730a3', '5b21b6', '9d174d', '334155',
	]),
]);

export function normalizeStageColor(color: unknown, fallback?: string): string
{
	return normalizeSharedStageColor(color, fallback);
}

export function isStageEditorPaletteColor(color: unknown): boolean
{
	if (!Type.isStringFilled(color))
	{
		return false;
	}

	const normalizedColor = color.replace(/^#/, '').toLowerCase();
	if (normalizeSharedStageColor(color) !== normalizedColor)
	{
		return false;
	}

	return StageEditorPalette.some((row) => row.includes(normalizedColor));
}

export function getDefaultStageEditorColor(): string
{
	return getDefaultStageColor();
}
