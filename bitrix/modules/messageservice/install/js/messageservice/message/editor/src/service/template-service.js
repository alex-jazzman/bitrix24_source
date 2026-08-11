import { ajax as Ajax, type AjaxResponse, Type } from 'main.core';
import { BaseEvent, type EventEmitter } from 'main.core.events';
import type { FilledPlaceholder } from 'messageservice.template.editor';
import type { Store } from 'ui.vue3.vuex';
import { type Template } from '../model/templates-model';
import { type Logger } from './logger';

type TemplatesAjaxResponse = AjaxResponse<{templates: Template[]}>;

export class TemplateService
{
	#logger: Logger;
	#store: Store;
	#emitter: EventEmitter;

	constructor(params: { logger: Logger, store: Store, eventEmitter: EventEmitter })
	{
		this.#logger = params.logger;
		this.#store = params.store;
		this.#emitter = params.eventEmitter;
	}

	loadTemplates(): Promise<void>
	{
		if (!this.#shouldLoadTemplates())
		{
			return Promise.resolve();
		}

		void this.#store.dispatch('application/setProgress', { isLoadingTemplates: true });

		const event = new BaseEvent();

		return this.#emitter.emitAsync('onLoadTemplates', event)
			.then((eventResults: TemplatesAjaxResponse[]) => {
				if (event.isDefaultPrevented())
				{
					return eventResults.find(
						(x) => Type.isPlainObject(x)
							&& x.status === 'success'
							&& Type.isArray(x.data.templates),
					);
				}

				return this.#loadDefault();
			})
			.then((result: ?TemplatesAjaxResponse) => {
				if (result?.data?.templates)
				{
					void this.#store.dispatch('templates/addTemplates', {
						templates: result.data.templates,
					});
				}
			})
			.catch((error) => {
				this.#logger.error('Error while loading templates', { error });

				throw error;
			})
			.finally(() => {
				void this.#store.dispatch('application/setProgress', { isLoadingTemplates: false });
			});
	}

	#shouldLoadTemplates(): boolean
	{
		return this.#store.getters['templates/shouldLoad'];
	}

	#loadDefault(): Promise<TemplatesAjaxResponse>
	{
		const senderId = this.#store.getters['channels/current']?.backend?.id;

		return new Promise((resolve, reject) => {
			Ajax.runAction('messageservice.Sender.getTemplates', {
				data: { id: senderId },
			})
				.then(resolve)
				.catch(reject);
		});
	}

	createOrUpdatePlaceholder(filledPlaceholder: FilledPlaceholder): void
	{
		this.#emitter.emit('Template:onUpdatePlaceholder', { filledPlaceholder });
	}
}
