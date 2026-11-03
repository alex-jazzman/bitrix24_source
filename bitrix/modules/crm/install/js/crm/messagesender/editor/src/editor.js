import { ajax as Ajax, Cache, Loc, Runtime, Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import {
	Editor as MessageServiceEditor,
	type EditorOptions as MessageServiceEditorOptions,
	replaceCustomMessagePlaceholders,
	type State as MessageServiceState,
	type TemplateBinding,
	type TemplatePlaceholder,
} from 'messageservice.message.editor';
import { type FilledPlaceholder } from 'messageservice.template.editor';

import { getCrmMode } from 'crm.integration.analytics';
import { type EventHandler } from 'crm.template.editor';

import { CrmValuesContentProvider } from './content-provider/crm-values-content-provider';
import { DocumentsContentProvider } from './content-provider/documents-content-provider';
import { SalesCenterContentProvider } from './content-provider/salescenter-content-provider';
import { ServiceLocator } from './service/service-locator';

const SIMPLY_PROXIED_EVENTS = [
	'onSendSuccess',
	'onCancel',
	'onChannelChange',
	'onFromChange',
	'onToChange',
	'onTemplateChange',
	'onStateChange',
];
const PAYMENT_SCENE_ID = 'crm.payment.details';
const SALESCENTER_PAYMENT_LINK_ATTR = 'salescenterPaymentLink';

export type EditorOptions = MessageServiceEditorOptions & {
	analytics: Pick<MessageServiceEditorOptions['analytics'], 'c_section' | 'c_sub_section'>,
	context: Context,
	dynamicLoad?: boolean,
};

export type State = MessageServiceState;

export type Context = {
	customData: {
		entityTypeId?: ?number,
		entityId?: ?number,
		categoryId?: ?number,
	},
	userId?: ?number,
};

/**
 * @memberOf BX.Crm.MessageSender
 *
 * @emits BX.Crm.MessageSender.Editor:onBeforeReload
 * @emits BX.Crm.MessageSender.Editor:onSendSuccess
 * @emits BX.Crm.MessageSender.Editor:onCancel
 * @emits BX.Crm.MessageSender.Editor:onChannelChange
 * @emits BX.Crm.MessageSender.Editor:onFromChange
 * @emits BX.Crm.MessageSender.Editor:onToChange
 * @emits BX.Crm.MessageSender.Editor:onMessageBodyChange
 * @emits BX.Crm.MessageSender.Editor:onTemplateChange
 * @emits BX.Crm.MessageSender.Editor:onStateChange
 */
export class Editor extends EventEmitter
{
	#options: EditorOptions;
	#locator: ServiceLocator;
	#templateEventHandler: EventHandler;
	#innerEditor: MessageServiceEditor;
	#templatesCache: Cache.MemoryCache = new Cache.MemoryCache();

	constructor(options: EditorOptions)
	{
		super();

		this.setEventNamespace('BX.Crm.MessageSender.Editor');

		this.#options = options;
		this.#normalizeOptions(this.#options);

		this.#locator = new ServiceLocator({ context: this.#options.context });
	}

	getOptions(): EditorOptions
	{
		return this.#options;
	}

	/**
	 * Export current editor state.
	 */
	getState(): ?State
	{
		const state = this.#innerEditor?.getState();
		if (!state)
		{
			return null;
		}

		return {
			...state,
			message: {
				...state.message,
				body: this.#locator.getEscapeService().encode(
					state.message.body,
					this.#locator.getPlaceholderService().getKnownCodes(state),
				),
			},
		};
	}

	/**
	 * Notify the editor that a real send attempt has started. Host scenes that
	 * drive sending themselves (e.g. payment) call this in their send-attempt
	 * point instead of using the editor footer. It does not emit `onSend`.
	 * No-op until the editor is rendered.
	 */
	handleSendAttempt(): void
	{
		// handleSendAttempt() comes from a newer messageservice bundle.
		if (Type.isFunction(this.#innerEditor?.handleSendAttempt))
		{
			this.#innerEditor.handleSendAttempt();
		}
	}

	/**
	 * WARNING! Don't modify the element, don't style.
	 * You can only use it for popup binding.
	 *
	 * Returns null if not rendered.
	 */
	getContainer(): ?HTMLElement
	{
		return this.#innerEditor?.getContainer() ?? null;
	}

	/**
	 * WARNING! Don't modify the element, don't style.
	 * You can only use it for popup binding.
	 *
	 * Returns null if not rendered.
	 */
	getContentContainer(): ?HTMLElement
	{
		return this.#innerEditor?.getContentContainer() ?? null;
	}

	setChannel(id: string): this
	{
		this.#innerEditor?.setChannel(id);

		return this;
	}

	setFrom(id: string): this
	{
		this.#innerEditor?.setFrom(id);

		return this;
	}

	setTo(toId: string): this
	{
		this.#innerEditor?.setTo(String(toId));

		return this;
	}

	setMessageText(text: string): this
	{
		this.#innerEditor?.setMessageText(
			this.#locator.getEscapeService().decode(text),
		);

		return this;
	}

	setTemplate(templateOriginalId: number): this
	{
		this.#innerEditor?.setTemplate(templateOriginalId);

		return this;
	}

	setFilledPlaceholder(filledPlaceholder: FilledPlaceholder): this
	{
		this.#innerEditor?.setFilledPlaceholder(filledPlaceholder);

		return this;
	}

	setError(error: string): this
	{
		this.#innerEditor?.setError(error);

		return this;
	}

	resetAlert(): this
	{
		this.#innerEditor?.resetAlert();

		return this;
	}

	async render(): Promise<void>
	{
		const options: MessageServiceEditorOptions = {
			...this.#mapOptions(),
			events: this.#getEvents(),
		};

		this.#innerEditor = new MessageServiceEditor(options);

		const factory = this.#innerEditor.getProviderFactory();
		this.#registerResolvers(factory);

		this.#locator.setProviderFactory(factory);

		return this.#innerEditor.render();
	}

	#mapOptions(): MessageServiceEditorOptions
	{
		const messageOption = this.#options.message ?? {};

		return {
			...this.#options,
			toList: this.#options.toList ?? [],
			analytics: {
				...this.#options.analytics,
				tool: 'crm',
				p1: getCrmMode(),
			},
			messages: {
				template: {
					selectField: Loc.getMessage('CRM_MESSAGESENDER_TEMPLATE_EDITOR_SELECT_FIELD'),
				},
			},
			message: {
				...messageOption,
				text: this.#locator.getEscapeService().decode(messageOption.text ?? ''),
			},
		};
	}

	#getEvents(): Object
	{
		const events = {
			...this.#getTemplateEvents(),
			onBeforeRender: async () => {
				await this.#load();

				this.#innerEditor.setOptions(this.#mapOptions());
			},
			onSend: () => {
				return this.#locator.getSendService().sendMessage(this.getState());
			},
			onMessageBodyChange: (event: BaseEvent) => {
				const { body, oldBody } = event.getData();
				const escape = this.#locator.getEscapeService();
				const knownCodes = this.#locator.getPlaceholderService().getKnownCodes(this.#innerEditor.getState());

				this.emit('onMessageBodyChange', {
					body: escape.encode(body ?? '', knownCodes),
					oldBody: escape.encode(oldBody ?? '', knownCodes),
				});
			},
			onBeforeAddChannelOpen: (event: BaseEvent) => {
				event.preventDefault();

				void Runtime.loadExtension('crm.router').then(({ Router }) => {
					return Router.Instance.openMessageSenderConnectionsSlider({
						c_section: this.#options.analytics?.c_section,
						c_sub_section: this.#options.analytics?.c_sub_section,
					});
				}).then(() => {
					void this.reload();
				});
			},
			'CustomTemplate:onFormRequested': (event: BaseEvent) => {
				this.#handleOpenForm(event.getData());
			},
			'CustomTemplate:onListRequested': (event: BaseEvent) => {
				this.#handleOpenList(event.getData());
			},
			onTemplatePlaceholderInsert: (event: BaseEvent) => {
				this.#handlePlaceholderInsert(event);
			},
		};

		for (const eventName of SIMPLY_PROXIED_EVENTS)
		{
			events[eventName] = (event: BaseEvent) => {
				this.emit(eventName, event.getData());
			};
		}

		return events;
	}

	#getTemplateEvents(): Object
	{
		return {
			onLoadPreview: async (event: BaseEvent) => {
				const handler = await this.#getTemplateEventHandler();

				const { template, ...restData } = event.getData();
				const convertedTemplate = replaceCustomMessagePlaceholders(
					this.#locator.getEscapeService().encode(
						template ?? '',
						this.#locator.getPlaceholderService().getKnownCodes(this.#innerEditor.getState()),
					),
					(value) => `{${value}}`,
				);

				const proxyEvent = new BaseEvent({
					data: {
						...restData,
						template: convertedTemplate,
					},
				});

				return handler.onLoadPreview(proxyEvent);
			},
			'Template:onShowFieldsDialog': async (event: BaseEvent) => {
				const handler = await this.#getTemplateEventHandler();

				return handler.onShowFieldsDialog(event);
			},
			'Template:onUpdatePlaceholder': (event: BaseEvent) => {
				const { filledPlaceholder } = event.getData();
				const { template } = this.#innerEditor.getState();
				if (!template)
				{
					return;
				}

				if (Type.isNil(this.#options.context.customData.entityTypeId))
				{
					return;
				}

				void Ajax.runAction(
					'crm.activity.smsplaceholder.createOrUpdatePlaceholder',
					{
						data: {
							placeholderId: filledPlaceholder.PLACEHOLDER_ID,
							fieldName: Type.isStringFilled(filledPlaceholder.FIELD_NAME) ? filledPlaceholder.FIELD_NAME : null,
							entityType: Type.isStringFilled(filledPlaceholder.FIELD_ENTITY_TYPE)
								? filledPlaceholder.FIELD_ENTITY_TYPE
								: null,
							fieldValue: Type.isStringFilled(filledPlaceholder.FIELD_VALUE) ? filledPlaceholder.FIELD_VALUE : null,
							templateId: template.ORIGINAL_ID,
							entityTypeId: this.#options.context.customData.entityTypeId,
							entityCategoryId: this.#options.context.customData.categoryId,
						},
					},
				);
			},
			onLoadTemplates: (event) => {
				event.preventDefault();

				return this.#templatesCache.remember(this.#getTemplateCacheId(), () => {
					return new Promise((resolve, reject) => {
						Ajax.runAction('crm.activity.sms.getTemplates', {
							data: {
								senderId: this.#innerEditor.getState().channel.backend.id,
								context: {
									entityTypeId: this.#options.context.customData.entityTypeId,
									entityId: this.#options.context.customData.entityId,
									entityCategoryId: this.#options.context.customData.categoryId,
								},
							},
						})
							.then(resolve)
							.catch(reject)
						;
					});
				});
			},
		};
	}

	#getTemplateEventHandler(): Promise<EventHandler>
	{
		if (this.#templateEventHandler)
		{
			return Promise.resolve(this.#templateEventHandler);
		}

		return Runtime.loadExtension('crm.template.editor').then((exports: { EventHandler: EventHandler }) => {
			this.#templateEventHandler = new exports.EventHandler({
				...this.#options.context.customData,
			});

			return this.#templateEventHandler;
		});
	}

	/**
	 * Bridge the inner editor's `CustomTemplate:onFormRequested` intent to the
	 * single canonical form opener exported by `crm.messagesender.custom-template.editor`.
	 *
	 * The opener fetches its own editor options through the CRM AJAX endpoint
	 * `crm.messagesender.editor.loadCustomTemplate` — so we don't have to forward
	 * channels/providers/layout from this surface.
	 */
	#handleOpenForm(payload: {
		mode: 'create' | 'edit',
		templateId: ?number,
		titleInitial?: string,
		bodyInitial?: string,
		bindElement?: ?HTMLElement,
		binding: TemplateBinding,
	}): void
	{
		void Runtime.loadExtension('crm.messagesender.custom-template.editor').then(({ openCustomTemplateForm }) => {
			return openCustomTemplateForm({
				mode: payload.mode,
				templateId: payload.templateId,
				scene: payload.binding.sceneId,
				targetId: payload.binding.targetId,
				titleInitial: payload.titleInitial ?? '',
				bodyInitial: payload.bodyInitial ?? '',
				bindElement: payload.bindElement ?? null,
			});
		});
	}

	#handleOpenList(payload: { binding: TemplateBinding }): void
	{
		const { sceneId, targetId } = payload.binding;
		if (!Type.isStringFilled(sceneId) || !Type.isStringFilled(targetId))
		{
			return;
		}

		void Runtime.loadExtension('crm.router').then(({ Router }) => {
			const url = `/crm/messagesender/templates/${encodeURIComponent(sceneId)}/${encodeURIComponent(targetId)}/`;

			return Router.openSlider(url, {
				allowChangeHistory: false,
				cacheable: false,
			});
		});
	}

	/**
	 * Per-placeholder insert hook of the inner editor. Decide keep/remove for the
	 * current recipient by comparing the placeholder origin (stamped at pick time)
	 * with the current context. Only this editor's own zone is handled; foreign
	 * zones are left to their own subscribers.
	 *
	 * The string `targetId` is never parsed here — only the structural origin
	 * attributes are read.
	 */
	#handlePlaceholderInsert(event: BaseEvent): void
	{
		const { placeholder, existingPlaceholders, binding } = event.getData();
		if (binding?.zoneId !== this.#options.scene?.templateBinding?.zoneId)
		{
			return;
		}

		if (this.#shouldRemovePlaceholder(placeholder?.attrs ?? {}, existingPlaceholders ?? []))
		{
			event.preventDefault();
		}
	}

	#shouldRemovePlaceholder(
		attrs: { [key: string]: string },
		existingPlaceholders: Array<TemplatePlaceholder>,
	): boolean
	{
		if (Text.toBoolean(attrs[SALESCENTER_PAYMENT_LINK_ATTR]))
		{
			if (this.#options.scene?.templateBinding?.sceneId !== PAYMENT_SCENE_ID)
			{
				return true;
			}

			// The payment scene body holds at most one payment link: the link is
			// non-removable, so a duplicate would be stuck in the message forever.
			return existingPlaceholders.some(
				(existing) => Text.toBoolean(existing.attrs?.[SALESCENTER_PAYMENT_LINK_ATTR]),
			);
		}

		// No origin classification (legacy / context-free placeholder) → keep.
		if (!Type.isStringFilled(attrs.entityTypeId))
		{
			return false;
		}

		const { entityTypeId } = this.#options.context.customData;
		const entityTypeMatches = attrs.entityTypeId === String(entityTypeId);

		// Base entity field — keep only when the entity type matches.
		if (!Text.toBoolean(attrs.isUf))
		{
			return !entityTypeMatches;
		}

		// User fields whose visibility does not depend on the category (Deal, Lead,
		// smart processes) are shared across categories — only the entity type must
		// match.
		if (!Text.toBoolean(attrs.categoryDependent))
		{
			return !entityTypeMatches;
		}

		// Category-governed user fields (Contact, Company) must match both the
		// entity type and the category of the current recipient.
		return !(entityTypeMatches && this.#categoryMatches(attrs.categoryId));
	}

	#categoryMatches(originCategoryId: ?string): boolean
	{
		const { categoryId } = this.#options.context.customData;

		return this.#normalizeCategoryId(originCategoryId) === this.#normalizeCategoryId(categoryId);
	}

	#normalizeCategoryId(value: ?string | ?number): string
	{
		// A missing category means the default category. The picker stamps the
		// default as '0' (binding is normalized to `...:0`), while a category-free
		// CRM context leaves it nil, so both sides collapse to '0' here.
		return Type.isStringFilled(value) || Type.isNumber(value) ? String(value) : '0';
	}

	#load(): Promise<void>
	{
		if (!this.#options.dynamicLoad)
		{
			return Promise.resolve();
		}

		return this.#actualizeOptions()
			.then(() => {
				this.#options.dynamicLoad = false;
			});
	}

	#actualizeOptions(): Promise<void>
	{
		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.messagesender.editor.load', {
				json: {
					sceneId: this.#options.scene.id,
					customData: {
						entityTypeId: this.#options.context.customData.entityTypeId,
						entityId: this.#options.context.customData.entityId,
						categoryId: this.#options.context.customData.categoryId,
					},
				},
			}).then((response) => {
				const newOptions = response.data.editor;
				this.#normalizeOptions(newOptions);

				this.#mutateOptions(this.#options, newOptions);
				resolve();
			}).catch(reject);
		});
	}

	#mutateOptions(options: EditorOptions, mutations: EditorOptions): void
	{
		const overrideKeys = new Set([
			'channels',
			'toList',
			'promoBanners',
			'contentProviders',
			'preferences',
		]);

		for (const [key, value] of Object.entries(mutations))
		{
			if (overrideKeys.has(key))
			{
				// eslint-disable-next-line no-param-reassign
				options[key] = value;
			}
		}
	}

	#normalizeOptions(options: EditorOptions): void
	{
		// eslint-disable-next-line no-param-reassign
		options.channels ??= [];
		// eslint-disable-next-line no-param-reassign
		options.toList ??= [];

		// eslint-disable-next-line no-param-reassign
		options.context ??= {};
		// eslint-disable-next-line no-param-reassign
		options.context.customData ??= {};
	}

	/**
	 * Actualize editor options from the server.
	 * Editor state is not lost.
	 */
	reload(): Promise<void>
	{
		const event = new BaseEvent();
		this.emit('onBeforeReload', event);
		if (event.isDefaultPrevented())
		{
			return Promise.resolve();
		}

		this.#innerEditor?.setLoading(true);
		this.#templatesCache = new Cache.MemoryCache();

		return this.#actualizeOptions()
			.then(() => {
				this.#innerEditor?.setOptions(this.#mapOptions());
			}).finally(() => {
				this.#innerEditor?.setLoading(false);
			});
	}

	#getTemplateCacheId(): string
	{
		const chan = this.getState()?.channel;
		if (Type.isNil(chan))
		{
			return '';
		}

		const parts = [
			chan.backend.senderCode,
			chan.backend.id,
			this.#options.context.customData.entityTypeId,
			this.#options.context.customData.entityId,
			this.#options.context.customData.categoryId,
		];

		return parts.filter((part) => !Type.isNil(part)).join('_');
	}

	destroy(): void
	{
		this.#innerEditor?.destroy();
		this.#innerEditor = null;

		this.#templateEventHandler?.destroy();
		this.#templateEventHandler = null;

		this.unsubscribeAll();

		Runtime.destroy(this);
	}

	#registerResolvers(factory): void
	{
		factory.registerResolver('crmValues', (data) => {
			return new CrmValuesContentProvider(data);
		});

		factory.registerResolver('salescenter', (data) => {
			return new SalesCenterContentProvider(data, this.#locator);
		});

		factory.registerResolver('documents', (data) => {
			return new DocumentsContentProvider(data, this.#locator);
		});
	}
}
