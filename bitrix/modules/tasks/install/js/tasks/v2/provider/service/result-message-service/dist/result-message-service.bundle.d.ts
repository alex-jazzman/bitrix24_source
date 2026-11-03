/* eslint-disable */
type ResultMessageMapDto = {
	[messageId: string]: number | string;
} | unknown[];

declare namespace BX.Tasks.V2.Provider.Service {
	class ResultMessageService {
		add(taskId: number, messageId: number): Promise<unknown>;
		delete(taskId: number, resultId: number): Promise<void>;
		getCurrentUserMap(taskId: number): Promise<ResultMessageMapDto>;
	}

	const resultMessageService: ResultMessageService;
}
