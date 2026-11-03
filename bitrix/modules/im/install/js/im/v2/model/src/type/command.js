export type CommandLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export type Command = {
	id: number,
	botId: number,
	command: string,
	category: string,
	common: 'Y' | 'N',
	context: string,
	title: string,
	params: string,
	extranet: 'Y' | 'N',
};
