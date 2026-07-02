import type { Property } from '../../types/property';

export type ComplexDocumentType = [string, string, string];
export type ComplexDocumentId = [string, string, string | number];

export type TemplateData = {
	id: number,
	name: string,
	description: string,
	documentType: ComplexDocumentType,
	parameters: Property[],
};

export type DocumentData = {
	documentType: ComplexDocumentType,
	documentId: ?ComplexDocumentId,
};

export type AutostartData = {
	templates: TemplateData[],
	documents: DocumentData[],
	signedDocumentType: ?string,
	signedDocumentId: ?string,
	autoExecuteType: number,
};
