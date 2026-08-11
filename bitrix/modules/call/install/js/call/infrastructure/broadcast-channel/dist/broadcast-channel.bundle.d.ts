/* eslint-disable */
declare namespace BX.Call.Infrastructure {
	class BroadcastRequestChannel<TPayload = unknown, TResponse = unknown> {
		private channel;
		private readonly senderId;
		private requests;
		private handle;
		constructor(name: string);
		executer(handler: (payload: TPayload) => TResponse): void;
		broadcastRequest(payload: TPayload, { timeout }?: {
			timeout?: number;
		}): Promise<TResponse[]>;
		destroy(): void;
	}
}
