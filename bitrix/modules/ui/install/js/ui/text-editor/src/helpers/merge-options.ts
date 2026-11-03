import { Type } from 'main.core';

import { type TextEditorOptions } from '../types/text-editor-options';

/**
 * Merges two option objects one level deep: plain-object values are merged key by key,
 * everything else (arrays, scalars, null, class instances) is replaced whole.
 *
 * This is not what master did -- there the options were a plain `{...defaults, ...options}`, so a
 * caller passing a partial section (`mention: { entities: [...] }`) cleared every other key under
 * it. The behaviour is pinned by merge-options.test.ts and, at the editor level, by
 * plugin-options.test.ts.
 */
export function mergeOptions(
	base: TextEditorOptions | null | undefined,
	overrides: TextEditorOptions | null | undefined,
): TextEditorOptions
{
	const result: Record<string, unknown> = { ...base };

	for (const [key, overrideValue] of Object.entries(overrides ?? {}))
	{
		if (overrideValue === undefined)
		{
			continue;
		}

		const baseValue: unknown = result[key];
		if (Type.isPlainObject(baseValue) && Type.isPlainObject(overrideValue))
		{
			result[key] = { ...(baseValue as object), ...(overrideValue as object) };
		}
		else
		{
			result[key] = overrideValue;
		}
	}

	return result as TextEditorOptions;
}
