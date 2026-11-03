/**
 * Payload of the copy event. A copied field is described by its type and by the modifier groups the
 * user applied: the code of the field, its name and its value never reach analytics, otherwise the
 * builder would turn into a channel leaking the field set of the portal.
 */

import type { ModifierGroupId } from './modifiers/types';

export type CopyCodeEvent = {
	category: string,
	event: string,
	c_section: string,
	c_sub_section: string,
	type: string,
	p1: string,
	p2: string,
	status: 'success' | 'error',
};

export type CopyCodeEventInput = {
	/** `type` of the field from the list contract; `null` when the server did not report it. */
	fieldType: string | null,
	groupIds: ModifierGroupId[],
	isCopied: boolean,
};

const UNKNOWN_FIELD_TYPE = 'unknown';
const NO_GROUPS = 'none';

/** A single underscore of `p1`..`p5` separates the prefix, so the value keeps none of its own. */
const asParameterValue = (value: string): string => value.replace(/_/g, '-');

export const buildCopyCodeEvent = (input: CopyCodeEventInput): CopyCodeEvent => {
	const groups = [...input.groupIds].sort();
	const fieldType = asParameterValue(input.fieldType ?? '');

	return {
		category: 'placeholders',
		event: 'copy_placeholder_code',
		c_section: 'sign',
		c_sub_section: 'placeholders',
		type: groups.length > 0 ? 'with-modifiers' : 'without-modifiers',
		p1: `fieldtype_${fieldType === '' ? UNKNOWN_FIELD_TYPE : fieldType}`,
		p2: `groups_${groups.length > 0 ? groups.map(asParameterValue).join('-') : NO_GROUPS}`,
		status: input.isCopied ? 'success' : 'error',
	};
};
