import { post } from '../../../shared/api';
import { Type } from 'main.core';

export const setUserSelectedBlock = (blockId: ?string = null): Promise<void> => {
	RequestQueue.add(() => post('Integration.AiAssistant.Block.set', { blockId }));
};

export class RequestQueue
{
	static processingRequest: ?Promise = null;
	static nextRequest: ?Function = null;

	static add(request: () => Promise): void
	{
		if (this.processingRequest)
		{
			this.nextRequest = request;

			return;
		}

		this.processingRequest = request()
			.finally(() => {
				this.processingRequest = null;
				if (Type.isFunction(this.nextRequest))
				{
					const next = this.nextRequest;
					this.nextRequest = null;
					this.add(next);
				}
			});
	}
}
