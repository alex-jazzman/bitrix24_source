/**
 * @module mail/templates/compose/src/template-api
 */
jn.define('mail/templates/compose/src/template-api', (require, exports, module) => {
	const CONTROLLER = 'mail.MailTemplate';
	const ACTION_URL = '/bitrix/services/main/ajax.php';

	const buildGetUrl = (action, payload) => {
		const query = Object.entries({ action: `${CONTROLLER}.${action}`, ...payload })
			.map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
			.join('&')
		;
		const domain = typeof currentDomain === 'string' && /^https?:\/\//.test(currentDomain)
			? currentDomain.replace(/\/$/, '')
			: ''
		;

		return `${domain}${ACTION_URL}?${query}`;
	};

	class MailTemplateApiError extends Error
	{
		constructor(errors = [])
		{
			super(errors[0]?.message ?? 'Mail template request failed.');
			this.name = 'MailTemplateApiError';
			this.errors = errors;
		}
	}

	class TemplateApi
	{
		constructor(
			transport = (action, config) => BX.ajax.runAction(action, config),
			getTransport = (config) => BX.ajax(config),
		)
		{
			this.transport = transport;
			this.getTransport = getTransport;
		}

		quickList(priorityReference = null, pinRecentlyCreated = false)
		{
			const payload = {};
			if (priorityReference)
			{
				payload['priorityReference[source]'] = priorityReference.source;
				payload['priorityReference[id]'] = priorityReference.id;
			}
			if (pinRecentlyCreated)
			{
				payload.pinRecentlyCreated = 1;
			}

			return this.#run('quickList', payload, 'GET');
		}

		search({ query = '', offset = 0, limit = 20 } = {})
		{
			return this.#run('search', { query, offset, limit }, 'GET');
		}

		prepare(reference)
		{
			return this.#run('prepare', { reference }, 'POST');
		}

		recordUsage(reference)
		{
			return this.#run('recordUsage', { reference }, 'POST');
		}

		create({ subject, bodyHtml, emailFrom = '' })
		{
			return this.#run('create', { subject, bodyHtml, emailFrom }, 'POST');
		}

		async #run(action, payload, method)
		{
			try
			{
				const response = method === 'GET'
					? await this.getTransport({
						url: buildGetUrl(action, payload),
						method,
						dataType: 'json',
					})
					: await this.transport(`${CONTROLLER}.${action}`, { data: payload })
				;
				if (response?.status === 'error' || response?.data === undefined)
				{
					throw new MailTemplateApiError(TemplateApi.getErrors(response));
				}

				return response.data;
			}
			catch (failure)
			{
				if (failure instanceof MailTemplateApiError)
				{
					throw failure;
				}

				throw new MailTemplateApiError(TemplateApi.getErrors(failure));
			}
		}

		static getErrors(failure)
		{
			if (Array.isArray(failure?.errors))
			{
				return failure.errors;
			}

			return Array.isArray(failure?.data?.errors) ? failure.data.errors : [];
		}
	}

	module.exports = { TemplateApi, MailTemplateApiError };
});
