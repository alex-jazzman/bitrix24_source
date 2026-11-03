import { type LinkedUserFieldMeta } from '../hub-baseline/hub-baseline';

export type LinkedUserFieldRow = {
	name: string;
	title: string;
	isEnabled: boolean;
};

// Joins the static meta (name + already-localized title, composed once by app.ts from
// params.linkedUserFields) with the live per-name enabled map: a name the map does not carry — nothing
// saved yet, or the field dropped out of the portal's live list — reads as unchecked rather than
// leaking `undefined` into the row or throwing.
export function buildLinkedUserFieldRows(
	meta: LinkedUserFieldMeta[],
	values: Record<string, boolean>,
): LinkedUserFieldRow[]
{
	return meta.map((item) => ({
		name: item.name,
		title: item.title,
		isEnabled: Boolean(values[item.name]),
	}));
}
