import { Receiver } from 'crm.messagesender';
import { Skeleton } from 'crm.messagesender.editor.skeleton';
import { type FilledPlaceholder } from 'crm.template.editor';
import type { JsonObject } from 'main.core';
import { ajax as Ajax, Dom, Loc, Runtime, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import type { VueCreateAppResult } from 'ui.vue3';
import { BitrixVue } from 'ui.vue3';
import { Builder, BuilderDatabaseType, type Store } from 'ui.vue3.vuex';
import { MessageEditor } from './components/message-editor';
import { AnalyticsModel } from './model/analytics-model';
import { ApplicationModel } from './model/application-model';
import { ChannelsModel } from './model/channels-model';
import { MessageModel } from './model/message-model';
import { PreferencesModel } from './model/preferences-model';
import { type Template, TemplatesModel } from './model/templates-model';
import { ServiceLocator } from './service/service-locator';
import { StateExporter } from './state-exporter';

export type EditorOptions = {
	renderTo: HTMLElement | string,
	scene: Scene,
	context: {
		entityTypeId: ?number,
		entityId: ?number,
		categoryId: ?number,
		userId: ?number,
	},
	channels?: Channel[],
	promoBanners?: PromoBanner[],
	dynamicLoad?: boolean,
	contentProviders: {[key: string]: ContentProvider},
	notificationTemplate?: NotificationTemplate,
	layout: Layout,
	preferences: Preferences,
	analytics: {
		c_section: ?string,
		c_sub_section: ?string,
	},
	message: {
		text: ?string,
	}
};

export type Scene = { id: string };

export type Channel = {
	id: string,
	backend: Backend,
	type: string,
	appearance: Appearance,
	fromList: From[],
	toList: Receiver[],
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

export type PromoBanner = {
	id: string,
	title: string,
	subtitle: string,
	background: string,
	icon: ?Icon,
	customIconName: ?string,
	connectionUrl: string,
}

export type ContentProvider = {
	isShown: boolean,
	isLocked: boolean,
	isEnabled: boolean,
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
	isMessageTextReadOnly: boolean,
	padding: string,
	paddingTop: ?string,
	paddingBottom: ?string,
	paddingLeft: ?string,
	paddingRight: ?string,
};

export type Preferences = {
	channelsSort: ChannelPosition[],
};

export type ChannelPosition = {
	channelId: string,
	isHidden: boolean,
};

export type State = {
	channel: ?Channel,
	from: ?From,
	to: ?Receiver,
	notificationTemplate?: NotificationTemplate,
	template?: Template,
	message: {
		body: string,
	}
};

// to avoid skeleton flickering for fast loads
const SKELETON_SHOW_DELAY = 200;

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
	#skeleton: ?Skeleton = null;
	#locator: ?ServiceLocator = null;
	#store: ?Store = null;
	#app: ?VueCreateAppResult = null;
	#rootComponent: ?Object = null;
	#stateExporter: ?StateExporter = null;

	constructor(options: EditorOptions)
	{
		super();

		this.setEventNamespace('BX.Crm.MessageSender.Editor');

		this.#options = options;
		this.#normalizeOptions(this.#options);
	}

	#normalizeOptions(options: EditorOptions): void
	{
		if (!Type.isArray(options.channels))
		{
			// eslint-disable-next-line no-param-reassign
			options.channels = [];
		}

		for (const channel of options.channels)
		{
			if (!Type.isArray(channel.toList))
			{
				channel.toList = [];
			}

			channel.toList = channel.toList.map((to: JsonObject | Receiver) => {
				if (Type.isPlainObject(to))
				{
					return Receiver.fromJSON(to);
				}

				return to;
			});
		}
	}

	#mergeOptions(newOptions: EditorOptions, oldOptions: EditorOptions): EditorOptions
	{
		const overrideKeys = new Set([
			'channels',
			'promoBanners',
			'dynamicLoad',
			'contentProviders',
			'preferences',
		]);

		// shared references ok, but don't modify the original
		const result = { ...oldOptions };

		for (const [key, value] of Object.entries(newOptions))
		{
			if (overrideKeys.has(key))
			{
				result[key] = value;
			}
		}

		return result;
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

	setTo(addressId: number): this
	{
		void this.#store?.dispatch('channels/setReceiver', {
			receiverAddressId: addressId,
		});

		return this;
	}

	setMessageText(text: string): this
	{
		void this.#store?.dispatch('message/setText', {
			text,
		});

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

		await this.#load();

		this.#locator = new ServiceLocator();

		const locator = this.#locator;
		this.#app = BitrixVue.createApp({
			name: 'CrmMessageSenderEditor',
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
		this.#locator.setMessageModel(messageModel);

		this.#app.use(store);

		clearTimeout(skeletonTimeoutId);
		Dom.clean(target);
		this.#rootComponent = this.#app.mount(target);

		this.#locator.setEventEmitter(this.#rootComponent.$Bitrix.eventEmitter);
		this.#stateExporter = new StateExporter({ store, eventEmitter: this });

		this.#bindEvents();

		this.#locator.getAnalyticsService().onRender();
	}

	async #buildStore(): Promise<{store: Store, models: {messageModel: MessageModel}}>
	{
		const messageModel = MessageModel.create()
			.useDatabase(false)
			.setLogger(this.#locator.getLogger())
			.setVariables({
				text: this.#options.message.text,
			})
		;

		const { store } = await Builder
			.init()
			.addModel(
				ApplicationModel.create()
					.useDatabase(false)
					.setLogger(this.#locator.getLogger())
					.setVariables({
						context: this.#options.context,
						contentProviders: this.#options.contentProviders,
						notificationTemplate: this.#options.notificationTemplate,
						promoBanners: this.#options.promoBanners,
						layout: this.#options.layout,
						scene: this.#options.scene,
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
				messageModel,
			)
			.addModel(
				TemplatesModel.create()
					.useDatabase(true) // cache for faster render, actualize on template load
					.setLogger(this.#locator.getLogger())
				,
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
			.setDatabaseConfig({
				name: 'crm-messagesender-editor',
				type: BuilderDatabaseType.indexedDb,
				siteId: Loc.getMessage('SITE_ID'),
				userId: Loc.getMessage('USER_ID'),
			})
			.build()
		;

		return { store, models: { messageModel } };
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

		void this.#store?.dispatch('application/setProgress', { isLoading: true });

		return this.#actualizeOptions()
			.then(() => {
				void this.#store?.dispatch('application/actualizeState', {
					context: this.#options.context,
					contentProviders: this.#options.contentProviders,
					notificationTemplate: this.#options.notificationTemplate,
					promoBanners: this.#options.promoBanners,
					layout: this.#options.layout,
					scene: this.#options.scene,
				});
				void this.#store?.dispatch('channels/actualizeState', {
					collection: this.#options.channels,
				});
				void this.#store?.dispatch('preferences/actualizeState', {
					channelsSort: this.#options.preferences?.channelsSort,
				});
			}).finally(() => {
				void this.#store?.dispatch('application/setProgress', { isLoading: false });
			});
	}

	#actualizeOptions(): Promise<void>
	{
		return this.#loadOptions()
			.then((options) => {
				this.#options = this.#mergeOptions(options, this.#options);
			});
	}

	#loadOptions(): Promise<EditorOptions>
	{
		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.messagesender.editor.load', {
				json: {
					sceneId: this.#options.scene?.id,
					entityTypeId: this.#options.context.entityTypeId,
					entityId: this.#options.context.entityId,
					categoryId: this.#options.context.categoryId,
				},
			}).then((response) => {
				const options = response.data.editor;

				this.#normalizeOptions(options);

				resolve(options);
			}).catch(reject);
		});
	}

	#bindEvents(): void
	{
		this.#rootComponent.$Bitrix.eventEmitter.subscribe(
			'crm:messagesender:editor:onConnectionsSliderClose',
			this.reload.bind(this),
		);
		this.#rootComponent.$Bitrix.eventEmitter.subscribe(
			'crm:messagesender:editor:onPromoBannerSliderClose',
			this.reload.bind(this),
		);
		this.#rootComponent.$Bitrix.eventEmitter.subscribe(
			'crm:messagesender:editor:onSendSuccess',
			() => {
				this.emit('onSendSuccess');
			},
		);
		this.#rootComponent.$Bitrix.eventEmitter.subscribe(
			'crm:messagesender:editor:onCancel',
			() => {
				this.emit('onCancel');
			},
		);
	}

	destroy(): void
	{
		this.#app?.unmount();
		this.#app = null;

		this.#rootComponent.$Bitrix.eventEmitter.unsubscribeAll();
		this.#rootComponent = null;

		this.#stateExporter?.destroy();
		this.#stateExporter = null;

		this.unsubscribeAll();

		this.#store = null;
		this.#locator = null;

		Runtime.destroy(this);
	}
}
