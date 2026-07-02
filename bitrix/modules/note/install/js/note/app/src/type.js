import type { DocumentData } from 'note.editor';

export type RouteDocumentContext = {
	status: 'idle' | 'loading' | 'ready' | 'not_found' | 'error',
	docId: number,
	document: DocumentData | null,
	ancestors: DocumentData[],
	openContext: Object | null,
	errorMessage: string,
};

export type ResolveResult = {
	status: 'ready' | 'not_found' | 'error',
	document: DocumentData | null,
	ancestors: DocumentData[],
	openContext: Object | null,
	errorMessage: string,
};
