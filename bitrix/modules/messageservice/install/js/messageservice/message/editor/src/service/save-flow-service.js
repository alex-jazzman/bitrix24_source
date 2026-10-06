import { Loc, Runtime, Text, Type } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';

import { SaveFlowDecision, type UsedTemplate } from '../model/message-model';
import { CUSTOM_TEMPLATE_CACHE_INVALIDATE_EVENT } from '../const/editor-events';
import { type Logger } from './logger';
import { type PreferencesService } from './preferences-service';

type CustomTemplateServiceLike = {
	create(params: Object): Promise<Object>,
	update(id: number, params: Object): Promise<Object>,
};

type Params = {
	logger: Logger,
	store: Store,
	eventEmitter: EventEmitter,
	preferencesService: PreferencesService,
	customTemplateServiceFactory: () => Promise<CustomTemplateServiceLike>,
};

type Snapshot = {
	decision: $Values<typeof SaveFlowDecision>,
	templateId: number,
	title: string,
	body: string,
	isForeign: boolean,
	binding: { zoneId: string, sceneId: string, targetId: string },
};

const TOAST_CATEGORY = 'messageservice-message-editor-save-flow';
const AUTO_SUFFIX_STRATEGY = 'autoSuffix';
const SAVE_FLOW_TOAST_WIDTH = 520;

/**
 * Offers to update or save the custom template used in a clean compose
 * scenario right after the user starts sending. The toast is fired in
 * parallel with the send and never blocks it: the send-attempt handler captures
 * the decision synchronously and returns immediately, while the template CUD
 * calls happen later, only if the user reacts to the toast.
 */
export class SaveFlowService
{
	#logger: Logger;
	#store: Store;
	#eventEmitter: EventEmitter;
	#preferencesService: PreferencesService;
	#customTemplateServiceFactory: () => Promise<CustomTemplateServiceLike>;

	constructor(params: Params)
	{
		this.#logger = params.logger;
		this.#store = params.store;
		this.#eventEmitter = params.eventEmitter;
		this.#preferencesService = params.preferencesService;
		this.#customTemplateServiceFactory = params.customTemplateServiceFactory;
	}

	/**
	 * Synchronous, non-blocking entry point invoked on a confirmed send attempt,
	 * both from the native send path (SendService) and from host-driven scenes.
	 * Errors are isolated here: a throw must never break sending.
	 * Returns immediately; the toast and any CUD calls happen out of band.
	 */
	handleSendAttempt(): void
	{
		try
		{
			this.#run();
		}
		catch (error)
		{
			this.#logger.error('saveFlow: send attempt handler failed', { error });
		}
	}

	#run(): void
	{
		if (this.#preferencesService.isSaveFlowDisabled())
		{
			return;
		}

		const snapshot = this.#captureSnapshot();
		if (snapshot === null)
		{
			return;
		}

		if (snapshot.decision === SaveFlowDecision.UpdateToast)
		{
			this.#showUpdateToast(snapshot);

			return;
		}

		if (snapshot.decision === SaveFlowDecision.SaveToast)
		{
			this.#showSaveToast(snapshot);
		}
	}

	#captureSnapshot(): ?Snapshot
	{
		const decision = this.#store.getters['message/saveFlowDecision'];
		if (decision === SaveFlowDecision.None)
		{
			return null;
		}

		const used: UsedTemplate = this.#store.state.message.usedTemplate;
		const binding = this.#store.state.application.scene?.templateBinding;
		if (!Type.isPlainObject(used) || !Type.isPlainObject(binding))
		{
			return null;
		}

		return {
			decision,
			templateId: used.id,
			title: used.title,
			body: this.#store.getters['message/body'],
			isForeign: used.isForeign,
			binding: {
				zoneId: binding.zoneId,
				sceneId: binding.sceneId,
				targetId: binding.targetId,
			},
		};
	}

	#showUpdateToast(snapshot: Snapshot): void
	{
		this.#notify({
			category: TOAST_CATEGORY,
			useAirDesign: true,
			width: SAVE_FLOW_TOAST_WIDTH,
			content: Loc.getMessage('MSGSVC_SAVE_FLOW_UPDATE_TITLE', {
				'#TITLE#': Text.encode(snapshot.title),
			}),
			actions: [
				{
					title: Loc.getMessage('MSGSVC_SAVE_FLOW_UPDATE_ACTION'),
					events: {
						click: (event, balloon) => {
							balloon.close();
							void this.#update(snapshot);
						},
					},
				},
				this.#buildOptOutAction(),
			],
		});
	}

	#showSaveToast(snapshot: Snapshot): void
	{
		this.#notify({
			category: TOAST_CATEGORY,
			useAirDesign: true,
			width: SAVE_FLOW_TOAST_WIDTH,
			content: Loc.getMessage('MSGSVC_SAVE_FLOW_SAVE_TITLE', {
				'#TITLE#': Text.encode(snapshot.title),
			}),
			actions: [
				{
					title: Loc.getMessage('MSGSVC_SAVE_FLOW_SAVE_ACTION'),
					events: {
						click: (event, balloon) => {
							balloon.close();
							void this.#create(snapshot);
						},
					},
				},
				this.#buildOptOutAction(),
			],
		});
	}

	#buildOptOutAction(): Object
	{
		return {
			title: Loc.getMessage('MSGSVC_SAVE_FLOW_OPT_OUT_ACTION'),
			events: {
				click: (event, balloon) => {
					balloon.close();
					this.#preferencesService.disableSaveFlow();
				},
			},
		};
	}

	async #update(snapshot: Snapshot): Promise<void>
	{
		const service = await this.#customTemplateServiceFactory();
		service
			.update(snapshot.templateId, { title: snapshot.title, body: snapshot.body })
			.then(() => {
				this.#invalidateTemplateCache();
			})
			.catch((response) => {
				this.#handleCudError(response);
			})
		;
	}

	async #create(snapshot: Snapshot): Promise<void>
	{
		const service = await this.#customTemplateServiceFactory();
		service
			.create({
				zone: snapshot.binding.zoneId,
				scene: snapshot.binding.sceneId,
				targetId: snapshot.binding.targetId,
				title: snapshot.title,
				body: snapshot.body,
				strategy: AUTO_SUFFIX_STRATEGY,
			})
			.then((data) => {
				this.#invalidateTemplateCache();

				const finalTitle = data?.title;
				if (Type.isStringFilled(finalTitle) && finalTitle !== snapshot.title)
				{
					this.#notify({
						category: TOAST_CATEGORY,
						useAirDesign: true,
						content: Loc.getMessage('MSGSVC_SAVE_FLOW_SAVED_SUFFIX', {
							'#TITLE#': Text.encode(finalTitle),
						}),
					});
				}
			})
			.catch((response) => {
				this.#handleCudError(response);
			})
		;
	}

	#handleCudError(response: Object): void
	{
		this.#logger.error('saveFlow: template CUD failed', { response });

		const message = response?.errors?.[0]?.message;

		this.#notify({
			category: TOAST_CATEGORY,
			useAirDesign: true,
			content: Type.isStringFilled(message)
				? Text.encode(message)
				: Loc.getMessage('MSGSVC_SAVE_FLOW_ERROR'),
		});
	}

	// Lazy-load so the base editor bundle does not eagerly pull notification.
	// A toast failure must never break sending, so the chain swallows errors.
	// Toasts share one category, so a reused balloon keeps its previous buttons:
	// only an explicit null clears them, undefined is a no-op for setActions().
	#notify(options: Object): void
	{
		Runtime.loadExtension('ui.notification')
			.then(({ Center }) => {
				Center.notify({ actions: null, ...options });
			})
			.catch((error) => {
				this.#logger.error('saveFlow: toast failed', { error });
			})
		;
	}

	#invalidateTemplateCache(): void
	{
		this.#eventEmitter.emit(CUSTOM_TEMPLATE_CACHE_INVALIDATE_EVENT);
	}

	// No-op kept for a uniform service lifecycle in ServiceLocator.destroy().
	destroy(): void
	{
	}
}
