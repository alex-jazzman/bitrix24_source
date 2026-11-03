import type { Analytics } from 'sign.v2.analytics';
import { type DocumentInitiatedType } from 'sign.type';

export type DocumentSendConfig = {
	region: string,
	languages: {[key: string]: { NAME: string; IS_BETA: boolean; }},
	documentMode: 'document' | 'template',
	initiatedByType?: DocumentInitiatedType,
	isOpenedFromRobot?: boolean,
	templateFolderId?: number,
	analytics?: Analytics,
	needSkipEditorStep: boolean,
};
export type DocumentData = {
	uid: string;
	title: string;
	blocks: Array<{ party: number; }>;
};
