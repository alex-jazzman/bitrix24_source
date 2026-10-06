import { Type } from 'main.core';

export function focusFirstAvailable(...candidates: Array<?Object>): void
{
	const target = candidates
		.flat()
		.find((candidate) => Type.isFunction(candidate?.focus) && candidate.disabled !== true)
	;

	target?.focus();
}
