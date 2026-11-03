import { type CustomSectionEntry, type RelationEntry } from '../../model/type-hub-store';

// What the imperative controls read: the store values plus the static params meta, composed by the app.
// On the render path it arrives as the `snapshot` prop; on the cancel path it is handed to the control
// explicitly, because the prop still holds the pre-revert render.
export type HubBaseline = Record<string, unknown>;

export type RelationCatalogEntry = {
	entityTypeId: number;
	title: string;
	isChecked: boolean;
	isChildrenListEnabled: boolean;
};

export type CustomSectionMeta = {
	isCreateSectionsViaAutomatedSolutionDetails: boolean;
	canEditAutomatedSolution: boolean;
	switcherDisabled: boolean;
	isNew: boolean;
	permissionsUrl: string | null;
};

const DEFAULT_CUSTOM_SECTION_META: CustomSectionMeta = Object.freeze({
	isCreateSectionsViaAutomatedSolutionDetails: false,
	canEditAutomatedSolution: false,
	switcherDisabled: false,
	isNew: true,
	permissionsUrl: null,
});

export function readRelationCatalog(baseline: HubBaseline, direction: string): RelationCatalogEntry[]
{
	const catalog = baseline.relationsCatalog;
	const byDirection = isObjectLike(catalog)
		? (catalog as Record<string, RelationCatalogEntry[]>)[direction]
		: null;

	return Array.isArray(byDirection) ? byDirection : [];
}

export function readRelationEntries(baseline: HubBaseline, direction: string): RelationEntry[]
{
	const relations = baseline.relations;
	const byDirection = isObjectLike(relations)
		? (relations as Record<string, RelationEntry[]>)[direction]
		: null;

	return Array.isArray(byDirection) ? byDirection : [];
}

// Copied per read: the control edits its own list (inline editor, titles updated from the toolbar event).
export function readCustomSections(baseline: HubBaseline): CustomSectionEntry[]
{
	const raw = baseline.customSections;

	return Array.isArray(raw) ? (raw as CustomSectionEntry[]).map((section) => ({ ...section })) : [];
}

export function hasSelectedCustomSection(sections: CustomSectionEntry[]): boolean
{
	return sections.some((section) => section.isSelected);
}

export function isCustomSectionSelected(
	selectedId: number | string,
	sectionId: number | string,
): boolean
{
	return String(selectedId) === String(sectionId);
}

export function readCustomSectionMeta(baseline: HubBaseline): CustomSectionMeta
{
	const raw = baseline.customSectionMeta;

	return isObjectLike(raw)
		? { ...DEFAULT_CUSTOM_SECTION_META, ...(raw as Partial<CustomSectionMeta>) }
		: { ...DEFAULT_CUSTOM_SECTION_META };
}

export function canEditCustomSection(
	baseline: HubBaseline,
	readOnly: boolean = false,
	disabled: boolean = false,
): boolean
{
	return !readOnly && !disabled && readCustomSectionMeta(baseline).canEditAutomatedSolution;
}

export function canDetachCustomSection(
	baseline: HubBaseline,
	readOnly: boolean = false,
	disabled: boolean = false,
): boolean
{
	return canEditCustomSection(baseline, readOnly, disabled)
		&& !readCustomSectionMeta(baseline).switcherDisabled;
}

export type LinkedUserFieldMeta = {
	name: string;
	title: string;
};

// Static list (name + already-localized title) app.ts composes once from params.linkedUserFields
// and never touches again — the live per-name enabled flags live separately, in readLinkedUserFields.
export function readLinkedUserFieldsMeta(baseline: HubBaseline): LinkedUserFieldMeta[]
{
	const raw = baseline.linkedUserFieldsMeta;

	return Array.isArray(raw) ? (raw as LinkedUserFieldMeta[]) : [];
}

export function readLinkedUserFields(baseline: HubBaseline): Record<string, boolean>
{
	const raw = baseline.linkedUserFields;

	return isObjectLike(raw) ? (raw as Record<string, boolean>) : {};
}

function isObjectLike(value: unknown): value is object
{
	return value !== null && Object(value) === value;
}
