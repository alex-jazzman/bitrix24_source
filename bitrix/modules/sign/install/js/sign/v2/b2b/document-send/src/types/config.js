export type DocumentSendConfig = {
	region: string,
	languages: {[key: string]: { NAME: string; IS_BETA: boolean; }},
};
export type DocumentData = {
	uid: string;
	title: string;
	blocks: Array<{ party: number; }>;
};
