import { type AvailableStep, type SettingsRecord } from '../../const/record';

// Records of a section available at the current supply step. Records seeded for a later step
// (availableFromStep > supplyStep) stay in the descriptor but are not rendered until the step rises.
export function filterSectionRecords(
	records: SettingsRecord[],
	sectionId: string,
	supplyStep: AvailableStep,
): SettingsRecord[]
{
	return records.filter(
		(record) => record.sectionId === sectionId && record.availableFromStep <= supplyStep,
	);
}
