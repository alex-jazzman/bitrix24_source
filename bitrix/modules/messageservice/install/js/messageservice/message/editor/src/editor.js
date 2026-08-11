import { Dom, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { Builder, type Store } from 'ui.vue3.vuex';

import { Skeleton } from 'messageservice.message.editor.skeleton';
import { type FilledPlaceholder } from 'messageservice.template.editor';

import { MessageEditor } from './components/message-editor';
import { ContentProviderFactory } from './content-provider/content-provider-factory';
import { CopilotContentProvider } from './content-provider/copilot-content-provider';
import { FilesContentProvider } from './content-provider/files-content-provider';
import { AnalyticsModel } from './model/analytics-model';
import { ApplicationModel } from './model/application-model';
import { ChannelsModel } from './model/channels-model';
import { MessageModel } from './model/message-model';
import { NotificationTemplatesModel } from './model/notification-templates-model';
import { PreferencesModel } from './model/preferences-model';
import { type Template, TemplatesModel } from './model/templates-model';
import { ToModel } from './model/to-model';
import { ServiceLocator } from './service/service-locator';
import { StateExporter } from './state-exporter';

export type EditorOptions = {
	renderTo: HTMLElement | string,
	scene: Scene,
	channels?: Channel[],
	toList?: To[],
	promoBanners?: PromoBanner[],
	contentProviders: {[key: string]: ContentProviderData},
	notificationTemplates?: NotificationTemplate[],
	layout: Layout,
	preferences: Preferences,
	analytics: Analytics,
	message: {
		text: ?string,
	},
	events?: { [eventName: string]: Function },
	messages?: Messages,
};

export type Messages = {
	template?: TemplateEditorMessages,
};

export type TemplateEditorMessages = {
	selectField?: string,
};

export type Scene = { id: string };

export type Channel = {
	id: string,
	backend: Backend,
	type: string,
	appearance: Appearance,
	fromList: From[],
	isConnected: boolean,
	connectionUrl: string,
	isPromo: boolean,
	isTemplatesBased: boolean,
};

export type Backend = { senderCode: string, id: string };

export type Appearance = {
	icon: Icon,
	title: string,
	subtitle: string | null,
	description?: string | null,
};

export type Icon = {
	title: string,
	color: string,
	background: string,
}

export type From = {
	id: string,
	name: string,
	description?: string | null,
	isDefault: boolean,
	isAvailable: boolean,
	type?: string | null,
};

export type To = {
	id: string,
	value: string,
	appearance: {
		caption: string,
		title: string,
		subtitle: string,
		avatar: string,
	},
	customData?: { [key: any]: any },
};

export type PromoBanner = {
	id: string,
	title: string,
	subtitle: string,
	background: string,
	icon: ?Icon,
	customIconName: ?string,
	connectionUrl: string,
}

export type ContentProviderData<CustomData: Object = Object> = {
	id: string,
	customData: CustomData,
};

export type NotificationTemplate = {
	code: string,
	translation?: {
		LANGUAGE_ID: string,
		TITLE: string,
		TEXT: string,
		TEXT_SMS: string,
	},
	placeholders: {name: string, value?: string, caption?: string}[],
	signed: string,
};

export type Layout = {
	isHeaderShown: boolean,
	isFooterShown: boolean,
	isSendButtonShown: boolean,
	isCancelButtonShown: boolean,
	isMessagePreviewShown: boolean,
	isContentProvidersShown: boolean,
	isEmojiButtonShown: boolean,
	isMessageLengthCounterShown: boolean,
	isToSelectorShown: boolean,
	isChannelSelectorShown: boolean,
	isMessageTextReadOnly: boolean,
	padding: string,
	paddingTop: ?string,
	paddingBottom: ?string,
	paddingLeft: ?string,
	paddingRight: ?string,
};

export type Preferences = {
	channelsSort: ChannelPosition[],
	channelsLastUsedFrom: ChannelLastUsedFrom[],
};

export type Analytics = {
	tool: ?string,
	c_section: ?string,
	c_sub_section: ?string,
	p1: ?string,
};

export type ChannelPosition = {
	channelId: string,
	isHidden: boolean,
};

export type ChannelLastUsedFrom = {
	channelId: string,
	fromId: string,
};

export type State = {
	channel: ?Channel,
	from: ?From,
	to: ?To,
	notificationTemplate?: NotificationTemplate,
	template?: Template,
	message: {
		body: string,
	}
};

// to avoid skeleton flickering for fast loads
const SKELETON_SHOW_DELAY = 200;

/**
 * @memberOf BX.MessageService.Message.Editor
 *
 * @emits BX.MessageService.Message.Editor:onBeforeRender
 * @emits BX.MessageService.Message.Editor:onSend
 * @emits BX.MessageService.Message.Editor:onSendSuccess
 * @emits BX.MessageService.Message.Editor:onCancel
 * @emits BX.MessageService.Message.Editor:onChannelChange
 * @emits BX.MessageService.Message.Editor:onFromChange
 * @emits BX.MessageService.Message.Editor:onToChange
 * @emits BX.MessageService.Message.Editor:onMessageBodyChange
 * @emits BX.MessageService.Message.Editor:onTemplateChange
 * @emits BX.MessageService.Message.Editor:onNotificationTemplateChange
 * @emits BX.MessageService.Message.Editor:onStateChange
 */
export class Editor extends EventEmitter
{
	#options: EditorOptions;
	#skeleton: ?Skeleton = null;
	#locator: ?ServiceLocator = null;
	#store: ?Store = null;
	#app: ?VueCreateAppResult = null;
	#rootComponent: ?Object = null;
	#stateExporter: ?StateExporter = null;

	constructor(options: EditorOptions)
	{
		super();

		this.setEventNamespace('BX.MessageService.Message.Editor');

		this.#options = options;
		this.#locator = new ServiceLocator();

		this.subscribeFromOptions(this.#options.events ?? {});
	}

	/**
	 * Export current editor state.
	 */
	getState(): ?State
	{
		return this.#stateExporter?.getState() ?? null;
	}

	/**
	 * WARNING! Don't modify the element, don't style.
	 * You can only use it for popup binding.
	 *
	 * Returns null if not rendered.
	 */
	getContainer(): ?HTMLElement
	{
		return this.#rootComponent?.$el ?? null;
	}

	/**
	 * WARNING! Don't modify the element, don't style.
	 * You can only use it for popup binding.
	 *
	 * Returns null if not rendered.
	 */
	getContentContainer(): ?HTMLElement
	{
		return this.getContainer()?.querySelector('[data-role="content-container"]') ?? null;
	}

	getOptions(): EditorOptions
	{
		return this.#options;
	}

	/**
	 * Actualize options. Please note that not all options can be changed after the editor was created.
	 */
	setOptions(options: Partial<EditorOptions>): this
	{
		const overrideKeys = new Set([
			'channels',
			'toList',
			'promoBanners',
			'contentProviders',
			'preferences',
		]);

		for (const [key, value] of Object.entries(options))
		{
			if (overrideKeys.has(key))
			{
				this.#options[key] = value;
			}
		}

		void this.#store?.dispatch('application/actualizeState', {
			contentProviders: this.#options.contentProviders,
			promoBanners: this.#options.promoBanners,
		});
		void this.#store?.dispatch('channels/actualizeState', {
			collection: this.#options.channels,
		});
		void this.#store?.dispatch('to/actualizeState', {
			collection: this.#options.toList,
		});
		void this.#store?.dispatch('preferences/actualizeState', {
			channelsSort: this.#options.preferences?.channelsSort,
		});

		return this;
	}

	setLoading(isLoading: boolean): this
	{
		void this.#store?.dispatch('application/setProgress', { isLoading });

		return this;
	}

	setChannel(id: string): this
	{
		void this.#store?.dispatch('channels/setChannel', {
			channelId: id,
		});

		return this;
	}

	setFrom(id: string): this
	{
		void this.#store?.dispatch('channels/setFrom', {
			fromId: id,
		});

		return this;
	}

	setTo(toId: string): this
	{
		void this.#store?.dispatch('to/setTo', {
			toId,
		});

		return this;
	}

	setMessageText(text: string): this
	{
		void this.#store?.dispatch('message/setText', { text });

		return this;
	}

	setTemplate(templateOriginalId: number): this
	{
		void this.#store?.dispatch('templates/setTemplate', {
			templateOriginalId,
		});

		return this;
	}

	setFilledPlaceholder(filledPlaceholder: FilledPlaceholder): this
	{
		void this.#store?.dispatch('templates/setFilledPlaceholder', {
			filledPlaceholder,
		});

		return this;
	}

	setNotificationTemplate(code: string): this
	{
		void this.#store?.dispatch('notificationTemplates/setSelected', {
			code,
		});

		return this;
	}

	setError(error: string): this
	{
		void this.#store?.dispatch('application/setAlert', { error });

		return this;
	}

	resetAlert(): this
	{
		void this.#store?.dispatch('application/resetAlert');

		return this;
	}

	getProviderFactory(): ContentProviderFactory
	{
		return this.#locator.getProviderFactory();
	}

	async render(): Promise<void>
	{
		const target = Type.isElementNode(this.#options.renderTo)
			? this.#options.renderTo
			: document.querySelector(this.#options.renderTo)
		;
		if (Type.isNil(target))
		{
			throw new TypeError(`Render container "${this.#options.renderTo}" not found`);
		}

		const skeletonTimeoutId = setTimeout(() => {
			Dom.clean(target);

			this.#skeleton ??= new Skeleton({ layout: this.#options.layout });
			this.#skeleton.renderTo(target);
		}, SKELETON_SHOW_DELAY);

		// options can be changed in onBeforeRender handlers
		await this.emitAsync('onBeforeRender');

		this.#locator.setEventEmitter(this);

		// Built-in content provider resolvers — all registered together
		const factory = this.#locator.getProviderFactory();
		factory.registerResolver('copilot', (data) => new CopilotContentProvider(data));
		factory.registerResolver('files', (data) => new FilesContentProvider(data, this.#locator));

		const locator = this.#locator;
		this.#app = BitrixVue.createApp({
			name: 'MessageServiceMessageEditor',
			components: {
				MessageEditor,
			},
			beforeCreate(): void
			{
				this.$bitrix.Data.set('locator', locator);
			},
			template: '<MessageEditor/>',
		});

		const { store, models: { messageModel } } = await this.#buildStore();

		this.#store = store;

		this.#locator.setStore(store);
		this.#stateExporter = new StateExporter({ store, eventEmitter: this });
		this.#locator.setMessageModel(messageModel);

		this.#app.use(store);

		clearTimeout(skeletonTimeoutId);
		Dom.clean(target);
		this.#rootComponent = this.#app.mount(target);

		this.#locator.getAnalyticsService().onRender();
	}

	async #buildStore(): Promise<{store: Store, models: {messageModel: MessageModel}}>
	{
		const messageModel = MessageModel.create()
			.useDatabase(false)
			.setLogger(this.#locator.getLogger())
			.setVariables({
				text: this.#options.message.text ?? '',
			})
		;

		const { store } = await Builder
			.init()
			.addModel(
				ApplicationModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
					.setVariables({
						contentProviders: this.#options.contentProviders,
						promoBanners: this.#options.promoBanners,
						layout: this.#options.layout,
						scene: this.#options.scene,
						messages: this.#options.messages,
					}),
			).addModel(
				ChannelsModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
					.setVariables({
						collection: this.#options.channels,
					}),
			)
			.addModel(
				ToModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
					.setVariables({
						collection: this.#options.toList,
					}),
			)
			.addModel(
				messageModel,
			)
			.addModel(
				TemplatesModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
				,
			)
			.addModel(
				NotificationTemplatesModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
					.setVariables({
						collection: this.#options.notificationTemplates,
					}),
			)
			.addModel(
				PreferencesModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
					.setVariables({
						channelsSort: this.#options.preferences?.channelsSort,
					}),
			)
			.addModel(
				AnalyticsModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
					.setVariables({
						analytics: this.#options.analytics,
					}),
			)
			.build()
		;

		return { store, models: { messageModel } };
	}

	destroy(): void
	{
		this.#app?.unmount();
		this.#app = null;

		this.#rootComponent?.$Bitrix?.eventEmitter?.unsubscribeAll();
		this.#rootComponent = null;

		this.#stateExporter?.destroy();
		this.#stateExporter = null;

		this.unsubscribeAll();

		this.#locator?.destroy();
		this.#locator = null;

		this.#store = null;

		Runtime.destroy(this);
	}
}
