import { type HubSectionDescriptor } from 'crm.settings-hub';

import {
	HUB_TREE_DEFAULT_SECTION_ID,
	HUB_TREE_SECTIONS,
	HUB_TREE_SECTION_BY_RECORD,
	HUB_TREE_SECTION_BY_TAB,
} from '../../const/hub-tree';
import { SP_HUB_RECORDS } from '../../const/descriptor';

// Menu of the hub. One tree since 2026-09-01: the module option that used to pick between the
// recomposed tree and the tabs it grew out of is gone, and so is the old tree — both were being
// edited anyway, so keeping the second one was cost without a reader (PM).
export function resolveHubSections(): HubSectionDescriptor[]
{
	return HUB_TREE_SECTIONS;
}

// isExternal has no tab of its own and opens the first section.
export function resolveActiveSectionId(activeTabId: string, isExternal: boolean): string
{
	if (isExternal)
	{
		return HUB_TREE_DEFAULT_SECTION_ID;
	}

	return HUB_TREE_SECTION_BY_TAB[activeTabId] ?? HUB_TREE_DEFAULT_SECTION_ID;
}

// Section a single record belongs to. The one place that reads the remap besides resolveHubRecords,
// so navigation targets (passport meta) cannot drift from where records went. Records the
// recomposition does not move keep the sectionId the descriptor gave them.
export function resolveRecordSectionId(recordId: string): string
{
	const descriptorSectionId = SP_HUB_RECORDS.find((record) => record.id === recordId)?.sectionId ?? '';

	return HUB_TREE_SECTION_BY_RECORD[recordId] ?? descriptorSectionId;
}

// Sections with their own designed layout: the shared grey page surface and bottom padding
// (.crm-type-hub.--designed-section in style.css) apply to these. Every section is designed today,
// so this follows the section list instead of a hand-kept copy of it.
export function resolveDesignedSectionIds(): string[]
{
	return resolveHubSections().map((section) => section.id);
}
