type ChannelMessage<TPayload, TResponse> =
	| { type: 'request'; requestId: string; senderId: string; payload: TPayload }
	| { type: 'response'; requestId: string; senderId: string; payload: TResponse };

type PendingRequest<TResponse> = {
	resolve: (responses: TResponse[]) => void;
	responses: TResponse[];
	responders: Set<string>;
	deadline: number;
};

export class BroadcastRequestChannel<TPayload = unknown, TResponse = unknown>
{
	private channel: BroadcastChannel;
	private readonly senderId: string;
	private requests: Map<string, PendingRequest<TResponse>>;
	private handle: ((payload: TPayload) => TResponse) | undefined = undefined;

	constructor(name: string)
	{
		this.channel = new BroadcastChannel(name);
		this.senderId = Math.random().toString(36).slice(2);
		this.requests = new Map();

		this.channel.onmessage = (event) => {
			const msg = event.data as ChannelMessage<TPayload, TResponse>;

			if (msg.type === 'response' && this.requests.has(msg.requestId))
			{
				const req = this.requests.get(msg.requestId)!;

				if (!req.responders.has(msg.senderId))
				{
					req.responders.add(msg.senderId);
					req.responses.push(msg.payload);

					if (Date.now() > req.deadline)
					{
						req.resolve(req.responses);
						this.requests.delete(msg.requestId);
					}
				}
			}

			if (msg.type === 'request' && msg.senderId !== this.senderId)
			{
				const result = this.handle ? this.handle(msg.payload) : undefined;

				if (result !== undefined)
				{
					this.channel.postMessage({
						type: 'response',
						requestId: msg.requestId,
						senderId: this.senderId,
						payload: result,
					});
				}
			}
		};
	}

	executer(handler: (payload: TPayload) => TResponse): void
	{
		this.handle = handler;
	}

	async broadcastRequest(payload: TPayload, { timeout = 100 }: { timeout?: number } = {}): Promise<TResponse[]>
	{
		const requestId = Math.random().toString(36).slice(2);

		return new Promise((resolve) => {
			this.requests.set(requestId, {
				resolve,
				responses: [],
				responders: new Set(),
				deadline: Date.now() + timeout,
			});

			this.channel.postMessage({
				type: 'request',
				requestId,
				senderId: this.senderId,
				payload,
			});

			setTimeout(() => {
				if (this.requests.has(requestId))
				{
					resolve(this.requests.get(requestId)!.responses);
					this.requests.delete(requestId);
				}
			}, timeout);
		});
	}

	destroy(): void
	{
		this.channel.close();
		this.requests.clear();
	}
}