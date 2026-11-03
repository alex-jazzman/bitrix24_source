/**
 * @module mail/draft/connector
 */
jn.define('mail/draft/connector', (require, exports, module) => {
	const { ajaxPublicErrorHandler } = require('error');
	const { AjaxMethod } = require('mail/const');
	const REVISION_CONFLICT = 'DRAFT_REVISION_CONFLICT';

	class DraftConnector
	{
		/**
		 * @param {DraftConnectorOptions} options
		 */
		constructor(options = {})
		{
			this.context = options.context ?? { type: 'mail' };
			this.runAction = options.runAction ?? ((action, config) => BX.ajax.runAction(action, config));
			this.errorHandler = options.errorHandler ?? ajaxPublicErrorHandler;
		}

		/**
		 * A probe of an independently released module: absence of the action is a normal answer, not an error.
		 *
		 * @param {DraftRequestOptions} options
		 */
		getConfig(options = {})
		{
			return this.#call(AjaxMethod.mailDraftConfig, {}, {
				handleErrors: options.handleErrors ?? false,
			});
		}

		/** @param {DraftSaveParams} params */
		save(params)
		{
			if (this.context.type === 'crm')
			{
				return this.#call(AjaxMethod.crmDraftSave, this.#withCrmContext(params));
			}

			return this.#call(AjaxMethod.mailDraftSave, params);
		}

		/** @param {{ draftId: number }} params */
		get(params)
		{
			return this.#call(AjaxMethod.mailDraftGet, params);
		}

		/** @param {DraftListParams} params */
		list(params)
		{
			return this.#call(AjaxMethod.mailDraftList, params);
		}

		/** @param {{ draftId: number, revision?: ?number, clientId?: ?string }} params */
		delete(params, options = {})
		{
			return this.#call(AjaxMethod.mailDraftDelete, params, {
				handleErrors: options.handleErrors ?? true,
			});
		}

		/** @param {{ draftIds: number[] }} params */
		deleteMany(params, options = {})
		{
			return this.#call(AjaxMethod.mailDraftDeleteMany, params, {
				handleErrors: options.handleErrors ?? true,
			});
		}

		/** @param {DraftRequestOptions} options */
		getByContext(options = {})
		{
			return this.#call(AjaxMethod.crmDraftGetByContext, this.#withCrmContext(), {
				handleErrors: options.handleErrors ?? true,
			});
		}

		deleteCurrent()
		{
			return this.#call(AjaxMethod.crmDraftDeleteCurrent, this.#withCrmContext());
		}

		/** @param {?number} draftId */
		getCurrent(draftId)
		{
			if (this.context.type === 'crm')
			{
				return this.getByContext();
			}

			return this.get({ draftId });
		}

		#withCrmContext(params = {})
		{
			return {
				entityTypeId: this.context.entityTypeId,
				entityId: this.context.entityId,
				...params,
			};
		}

		#call(action, data, options = {})
		{
			const { handleErrors = true, ...requestOptions } = options;

			return this.runAction(action, { data, ...requestOptions }).catch(async (response) => {
				if (handleErrors && !this.#hasErrorCode(response, REVISION_CONFLICT))
				{
					await this.errorHandler(response);
				}

				throw response;
			});
		}

		#hasErrorCode(response, code)
		{
			return (response?.errors ?? []).some((error) => error.code === code);
		}
	}

	module.exports = { DraftConnector };
});
