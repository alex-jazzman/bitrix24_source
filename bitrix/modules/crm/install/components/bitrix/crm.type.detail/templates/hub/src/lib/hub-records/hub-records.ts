import { type SettingsRecord } from 'crm.settings-hub';

import { SP_HUB_RECORDS } from '../../const/descriptor';
import { HUB_TREE_SECTION_BY_RECORD } from '../../const/hub-tree';

// Custom sections unavailable on the portal: prod hides the whole tab, and TypeFormAdapter keeps the
// seed block instead of the store values, so the record must not reach the hub either: otherwise the
// setting is shown, edited and silently dropped from the payload.
//
// sectionId is rewritten onto the recomposed tree (spec 2026-08-31). Records are COPIED, never
// mutated: descriptor.ts belongs to the kit's author and is not touched by this work.
export function resolveHubRecords(isCustomSectionsAvailable: boolean): SettingsRecord[]
{
	const records = isCustomSectionsAvailable
		? SP_HUB_RECORDS
		: SP_HUB_RECORDS.filter((record) => record.id !== 'sp-custom-section')
	;

	return records.map((record) => {
		const sectionId = HUB_TREE_SECTION_BY_RECORD[record.id];

		return (sectionId && sectionId !== record.sectionId) ? { ...record, sectionId } : record;
	});
}
