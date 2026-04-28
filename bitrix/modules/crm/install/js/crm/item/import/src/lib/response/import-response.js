import { Type } from 'main.core';

export type ImportResponseData = {
	successImportCount: number,
	failImportCount: number,
	duplicateImportCount: number,
	currentLine: number,
	progressedBytes: number,
	isFinished: boolean,
	errorsPreviewTable: ?PreviewTable,
	downloadFailImportFileUrl: ?string,
	downloadDuplicateImportFileUrl: ?string,
};

export type PreviewTable = {
	headers: string[],
	rows: {
		errors: string[],
		values: string[],
	}[],
};

export class ImportResponse
{
	successImportCount: number;
	failImportCount: number;
	duplicateImportCount: number;
	currentLine: number;
	progressedBytes: number;
	isFinished: boolean;
	errorsPreviewTable: ?PreviewTable;
	downloadFailImportFileUrl: ?string;
	downloadDuplicateImportFileUrl: ?string;

	constructor(data: ImportResponseData)
	{
		if (!Type.isObject(data))
		{
			throw new TypeError('Invalid data: object required');
		}

		this.successImportCount = Type.isNumber(data.successImportCount) ? data.successImportCount : 0;
		this.failImportCount = Type.isNumber(data.failImportCount) ? data.failImportCount : 0;
		this.duplicateImportCount = Type.isNumber(data.duplicateImportCount) ? data.duplicateImportCount : 0;
		this.currentLine = Type.isNumber(data.currentLine) ? data.currentLine : 0;
		this.progressedBytes = Type.isNumber(data.progressedBytes) ? data.progressedBytes : 0;
		this.isFinished = Type.isBoolean(data.isFinished) ? data.isFinished : true;
		this.errorsPreviewTable = data.errorsPreviewTable;
		this.downloadFailImportFileUrl = data.downloadFailImportFileUrl;
		this.downloadDuplicateImportFileUrl = data.downloadDuplicateImportFileUrl;
	}
}
