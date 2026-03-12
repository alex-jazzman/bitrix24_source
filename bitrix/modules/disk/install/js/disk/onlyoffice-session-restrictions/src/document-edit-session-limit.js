import { Extension } from 'main.core';

export class DocumentEditSessionLimit
{
	static #instance = null;
	#availableDocumentSessionCount: ?Number = null;

	constructor()
	{
		const extName = 'disk.onlyoffice-session-restrictions';
		const tag = Extension.getSettings(extName).get('tag');
		this.#availableDocumentSessionCount = Extension.getSettings(extName).get('availableDocumentSessionCount');

		BX.PULL.extendWatch(tag);
		BX.PULL.subscribe({
			type: BX.PullClient.SubscriptionType.Server,
			moduleId: 'disk',
			command: Extension.getSettings(extName).get('command'),
			callback: (params) => {
				this.#availableDocumentSessionCount = params.value;
			},
		});
	}

	static initialize(): void
	{
		if (this.#instance === null)
		{
			this.#instance = new this();
		}
	}

	static getInstance(): DocumentEditSessionLimit
	{
		this.initialize();

		return this.#instance;
	}

	isExceeded(): boolean
	{
		return this.#availableDocumentSessionCount <= 0;
	}
}
