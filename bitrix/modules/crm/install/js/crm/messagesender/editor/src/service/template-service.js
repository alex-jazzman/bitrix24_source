import type { OnSelectParams } from 'crm.template.editor';
import { ajax as Ajax, type AjaxResponse, Cache, Type } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import { type Channel, type EditorOptions } from '../editor';
import { type Template } from '../model/templates-model';
import { type Logger } from './logger';

type TemplatesAjaxResponse = AjaxResponse<{templates: Template[]}>;

export class TemplateService
{
	#sessionCache: Cache.MemoryCache = new Cache.MemoryCache();
	#logger: Logger;
	#store: Store;

	constructor(params: { logger: Logger, store: Store })
	{
		this.#logger = params.logger;
		this.#store = params.store;
	}

	loadTemplates(): void
	{
		this.#doOnce(() => {
			const chan = this.#getCurrentChannel();
			if (!chan || !chan.isTemplatesBased || !chan.backend.senderCode === 'sms_provider')
			{
				return;
			}

			Ajax.runAction('crm.activity.sms.getTemplates', {
				data: {
					senderId: chan.backend.id,
					context: {
						entityTypeId: this.#getContext().entityTypeId,
						entityId: this.#getContext().entityId,
						entityCategoryId: this.#getContext().categoryId,
					},
				},
			}).then((response: TemplatesAjaxResponse) => {
				this.#cacheTemplates(response.data.templates);
			}).catch((response: TemplatesAjaxResponse | any) => {
				this.#logger.error('Error while loading templates', response);

				throw response;
			});
		});
	}

	#doOnce(callback: () => void): void
	{
		this.#sessionCache.remember(this.#store.getters['templates/cacheContextId'], callback);
	}

	#getCurrentChannel(): ?Channel
	{
		return this.#store.getters['channels/current'];
	}

	#getCurrentTemplate(): ?Template
	{
		return this.#store.getters['templates/current'];
	}

	#getContext(): EditorOptions['context']
	{
		return this.#store.state.application.context;
	}

	#cacheTemplates(templates: Template[]): void
	{
		void this.#store.dispatch('templates/addTemplates', { templates });
	}

	createOrUpdatePlaceholder(params: OnSelectParams): void
	{
		const template = this.#getCurrentTemplate();
		if (!template)
		{
			return;
		}

		const context = this.#getContext();
		if (Type.isNil(context.entityTypeId))
		{
			return;
		}

		const { id, value, entityType, text } = params;

		Ajax.runAction(
			'crm.activity.smsplaceholder.createOrUpdatePlaceholder',
			{
				data: {
					placeholderId: id,
					fieldName: Type.isStringFilled(value) ? value : null,
					entityType: Type.isStringFilled(entityType) ? entityType : null,
					fieldValue: Type.isStringFilled(text) ? text : null,
					templateId: template.ORIGINAL_ID,
					entityTypeId: context.entityTypeId,
					entityCategoryId: context.categoryId,
				},
			},
		).catch((response: AjaxResponse | any) => {
			this.#logger.warn('Error while remembering placeholder', response);
		});
	}
}
