import { Loc } from 'main.core';

export const DataType = {
	string: 'string',
	money: 'money',
	int: 'int',
	double: 'double',
	date: 'date',
	datetime: 'datetime',
} as const;

export type DataTypeKey = typeof DataType[keyof typeof DataType];

export type DataTypeDescription = {
	title: string,
	icon: string,
};

export function getDataTypeDescriptions(): Record<string, DataTypeDescription>
{
	return {
		[DataType.string]: {
			title: Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_TEXT') || 'Text',
			icon: '--formatting',
		},
		[DataType.money]: {
			title: Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_MONEY') || 'Money',
			icon: '--money',
		},
		[DataType.int]: {
			title: Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_NUMBER') || 'Number',
			icon: '--numbers-123',
		},
		[DataType.double]: {
			title: Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_DECIMAL') || 'Decimal',
			icon: '--numbers-05',
		},
		[DataType.date]: {
			title: Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_DATE') || 'Date',
			icon: '--calendar-1',
		},
		[DataType.datetime]: {
			title: Loc.getMessage('DATASET_IMPORT_V2_FIELD_TYPE_DATETIME') || 'Date & time',
			icon: '--planning-2',
		},
	};
}
