import type { Copilot, CopilotEvents } from 'ai.copilot';
import { Runtime, Type } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import type { Store } from 'ui.vue3.vuex';
import type { Logger } from './logger';

export type CopilotResult = {
	textReplace?: string,
	textBelow?: string,
};

type CopilotHandler = (copilot: Copilot, resolve: (any) => void, event: BaseEvent) => void;

export class CopilotService
{
	#logger: Logger;
	#store: Store;

	#copilot: ?Copilot = null;
	#copilotEvents: ?CopilotEvents = null;

	constructor(params: { logger: Logger, store: Store })
	{
		this.#logger = params.logger;
		this.#store = params.store;
	}

	/**
	 * Show copilot dialog and resolve when it's closed. Resolve result will contain text that should be added to the
	 * message.
	 */
	showCopilot(bindElement: HTMLElement, selectedText: string, allText: string): Promise<CopilotResult>
	{
		return new Promise((resolve, reject) => {
			this.#getCopilot().then((copilot: Copilot) => {
				const handlers = this.#getHandlers();
				for (const [event, handler] of Object.entries(handlers))
				{
					// mega-hack to remember all references to the handler functions so we can unsubscribe them later
					handlers[event] = handler.bind(this, copilot, resolve);
				}

				for (const [event, handler] of Object.entries(handlers))
				{
					copilot.subscribeOnce(event, handler);
				}

				if (Type.isStringFilled(selectedText.trim()))
				{
					copilot.setSelectedText(selectedText.trim());
				}
				else if (Type.isStringFilled(allText.trim()))
				{
					copilot.setContext(allText.trim());
				}

				copilot.show({
					bindElement,
				});
			}).catch((error) => {
				this.#logger.error('CopilotService: Failed to show AI Copilot', error);

				reject(error);
			});
		});
	}

	#getCopilot(): Promise<Copilot>
	{
		if (this.#copilot)
		{
			return Promise.resolve(this.#copilot);
		}

		return new Promise((resolve, reject) => {
			this.#loadExtension()
				.then((exports) => {
					/** @see BX.AI.CopilotEvents */
					this.#copilotEvents = exports.CopilotEvents;

					/** @see BX.AI.Copilot */
					/** @see BX.AI.CopilotMode */
					this.#copilot = new exports.Copilot({
						moduleId: 'crm',
						contextId: 'crm.messagesender.editor',
						category: this.#store.state.application.contentProviders.copilot?.category,
						mode: exports.CopilotMode.TEXT,
						autoHide: true,
						showResultInCopilot: true,
					});

					this.#copilot.subscribeOnce(this.#copilotEvents.START_INIT, () => {
						void this.#store.dispatch('application/setProgress', { isLoading: true });
					});

					this.#copilot.subscribeOnce(this.#copilotEvents.FINISH_INIT, () => {
						void this.#store.dispatch('application/setProgress', { isLoading: false });

						resolve(this.#copilot);
					});

					this.#copilot.subscribeOnce(this.#copilotEvents.FAILED_INIT, () => {
						void this.#store.dispatch('application/setProgress', { isLoading: false });

						reject(this.#copilot);
					});

					this.#copilot.init();
				})
				.catch((error) => {
					this.#logger.error('CopilotService: Failed to initialize AI Copilot', error);
					reject(error);
				});
		});
	}

	#loadExtension(): Promise<Object>
	{
		return Runtime.loadExtension('ai.copilot')
			.catch((error) => {
				this.#logger.error('CopilotService: Failed to load AI Copilot extension', error);
				throw error;
			});
	}

	#getHandlers(): { [eventName: string]: CopilotHandler }
	{
		// whichever fires first will resolve the promise and unsubscribe all handlers
		const handlers = {
			[this.#copilotEvents.TEXT_SAVE]: (copilot, resolve, event) => {
				const { result } = event.getData();

				unsubscribeAllHandlers(copilot);

				resolve({
					textReplace: result,
				});

				copilot.hide();
			},
			[this.#copilotEvents.TEXT_PLACE_BELOW]: (copilot, resolve, event) => {
				const { result } = event.getData();

				unsubscribeAllHandlers(copilot);

				resolve({
					textBelow: result,
				});

				copilot.hide();
			},
			[this.#copilotEvents.HIDE]: (copilot, resolve) => {
				unsubscribeAllHandlers(copilot);

				resolve({});
			},
		};

		const unsubscribeAllHandlers = (copilot: Copilot) => {
			for (const [event, handler] of Object.entries(handlers))
			{
				copilot.unsubscribe(event, handler);
			}
		};

		return handlers;
	}
}
