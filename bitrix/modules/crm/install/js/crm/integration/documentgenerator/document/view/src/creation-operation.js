import { ajax } from 'main.core';

export class CreationOperation
{
	#operationId;
	#signedParameters;
	#request;
	#location;
	#history;
	#activeRequest = null;
	#generation = 0;
	#documentUrlCommitted = false;

	constructor(options)
	{
		this.#operationId = options.operationId;
		this.#signedParameters = options.signedParameters;
		this.#request = options.request || ((requestOptions) => ajax.runComponentAction(
			'bitrix:crm.document.view',
			'createDocument',
			requestOptions,
		));
		this.#location = options.location || window.location;
		this.#history = options.history || window.history;
	}

	getId()
	{
		return this.#operationId;
	}

	run()
	{
		if (this.#activeRequest)
		{
			return this.#activeRequest;
		}

		this.#persistInUrl();
		const generation = this.#generation;
		let request = null;
		try
		{
			request = this.#request({
				mode: 'class',
				data: { operationId: this.#operationId },
				signedParameters: this.#signedParameters,
			});
		}
		catch (error)
		{
			request = Promise.reject(error);
		}

		this.#activeRequest = Promise.resolve(request).finally(() => {
			if (generation === this.#generation)
			{
				this.#activeRequest = null;
			}
		});

		return this.#activeRequest;
	}

	/**
	 * Once the document exists, the address has to survive a reload as the document and not as a creation
	 * request: the stored operation state expires, and a reload of the creation address creates a second
	 * document. That is also why the operation id is not written to the address any more.
	 */
	commitDocumentUrl(documentUrl)
	{
		if (this.#documentUrlCommitted || !documentUrl)
		{
			return;
		}

		this.#documentUrlCommitted = true;
		this.#history.replaceState({}, '', documentUrl);
	}

	reset()
	{
		this.#generation++;
		this.#activeRequest = null;
	}

	#persistInUrl()
	{
		if (!this.#operationId || this.#documentUrlCommitted)
		{
			return;
		}

		const url = new URL(this.#location.href);
		url.searchParams.set('operationId', this.#operationId);
		this.#history.replaceState({}, '', url.toString());
	}
}
