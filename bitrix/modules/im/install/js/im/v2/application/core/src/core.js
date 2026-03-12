import { Type, Extension, Loc } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { Builder } from 'ui.vue3.vuex';

import 'pull.client';
import 'rest.client';

import 'im.v2.application.launch';

import {
	ApplicationModel,
	MessagesModel,
	ChatsModel,
	UsersModel,
	FilesModel,
	RecentModel,
	NotificationsModel,
	SidebarModel,
	MarketModel,
	CountersModel,
	CopilotModel,
	AiAssistantModel,
	StickersModel,
} from 'im.v2.model';
import {
	BasePullHandler,
	RecentPullHandler,
	RecentUnreadPullHandler,
	NotificationPullHandler,
	NotifierPullHandler,
	OnlinePullHandler,
	CounterPullHandler,
	AnchorPullHandler,
	SidebarPullHandler,
	StickersPullHandler,
} from 'im.v2.provider.pull';
import { OpenLinesLaunchResources } from 'imopenlines.v2.lib.launch-resources';

import type { Store } from 'ui.vue3.vuex';
import type { RestClient } from 'rest.client';
import type { PullClient } from 'pull.client';
import type { ApplicationData } from './types/types';

class CoreApplication
{
	#initPromise: ?Promise<CoreApplication> = null;
	#store: ?Store = null;
	#restClient: ?RestClient = null;
	#pullClient: ?PullClient = null;
	#host: string;
	#userId: number;
	#siteId: string;
	#languageId: string;
	#offline: boolean = false;
	#applicationData: ApplicationData = {};

	constructor()
	{
		this.#prepareVariables();
		this.#initRestClient();
	}

	ready(): Promise<CoreApplication>
	{
		if (!this.#initPromise)
		{
			this.#initPromise = this.#init();
		}

		return this.#initPromise;
	}

	createVue(application, config = {}): Promise
	{
		const initConfig = {};

		if (config.el)
		{
			initConfig.el = config.el;
		}

		if (config.template)
		{
			initConfig.template = config.template;
		}

		if (config.name)
		{
			initConfig.name = config.name;
		}

		if (config.components)
		{
			initConfig.components = config.components;
		}

		if (config.data)
		{
			initConfig.data = config.data;
		}

		return new Promise((resolve) => {
			initConfig.created = function() {
				if (Type.isFunction(config.created))
				{
					config.created.call(this);
				}

				resolve(this);
			};
			const bitrixVue = BitrixVue.createApp(initConfig);
			bitrixVue.config.errorHandler = function(err, vm, info) {
				// eslint-disable-next-line no-console
				console.error(err, vm, info);

				if (Type.isFunction(config.onError))
				{
					config.onError(err);
				}
			};

			bitrixVue.config.warnHandler = function(warn, vm, trace) {
				// eslint-disable-next-line no-console
				console.warn(warn, vm, trace);
			};

			// todo: remove after updating Vue to 3.3+
			bitrixVue.config.unwrapInjectedRef = true;

			// eslint-disable-next-line no-param-reassign
			application.bitrixVue = bitrixVue;
			bitrixVue.use(this.#store).mount(initConfig.el);
		});
	}

	getHost(): string
	{
		return this.#host;
	}

	getUserId(): number
	{
		return this.#userId;
	}

	getSiteId(): string
	{
		return this.#siteId;
	}

	getLanguageId(): string
	{
		return this.#languageId;
	}

	getStore(): Store
	{
		return this.#store;
	}

	getRestClient(): RestClient
	{
		return this.#restClient;
	}

	getPullClient(): PullClient
	{
		return this.#pullClient;
	}

	setApplicationData(data: {string: any})
	{
		this.#applicationData = { ...this.#applicationData, ...data };
	}

	getApplicationData(): ApplicationData
	{
		return this.#applicationData;
	}

	isOnline(): boolean
	{
		return !this.#offline;
	}

	isCloud(): boolean
	{
		const settings = Extension.getSettings('im.v2.application.core');

		return settings.get('isCloud');
	}

	async #init(): Promise<CoreApplication>
	{
		try
		{
			await this.#initStorage();
			await this.#initPull();

			return this;
		}
		catch (error)
		{
			console.error('Core: error starting core application', error);
			throw error;
		}
	}

	#prepareVariables()
	{
		this.#host = location.origin;
		this.#userId = Number.parseInt(Loc.getMessage('USER_ID'), 10) ?? 0;
		this.#siteId = Loc.getMessage('SITE_ID') ?? 's1';
		this.#languageId = Loc.getMessage('LANGUAGE_ID') ?? 'en';
	}

	#initRestClient()
	{
		this.#restClient = BX.rest;
	}

	async #initStorage(): Promise
	{
		const builder = Builder.init()
			.addModel(ApplicationModel.create())
			.addModel(MessagesModel.create())
			.addModel(ChatsModel.create())
			.addModel(FilesModel.create())
			.addModel(UsersModel.create())
			.addModel(RecentModel.create())
			.addModel(CountersModel.create())
			.addModel(NotificationsModel.create())
			.addModel(SidebarModel.create())
			.addModel(MarketModel.create())
			.addModel(CopilotModel.create())
			.addModel(StickersModel.create())
			.addModel(AiAssistantModel.create())
		;

		if (OpenLinesLaunchResources)
		{
			OpenLinesLaunchResources.models.forEach((model) => {
				builder.addModel(model.create());
			});
		}

		const buildResult: { store: Store } = await builder.build();
		this.#store = buildResult.store;
	}

	#initPull(): Promise
	{
		this.#pullClient = BX.PULL;
		if (!this.#pullClient)
		{
			return Promise.reject(new Error('Core: error setting pull client'));
		}

		this.#pullClient.subscribe(new BasePullHandler());
		this.#pullClient.subscribe(new RecentPullHandler());
		this.#pullClient.subscribe(new RecentUnreadPullHandler());
		this.#pullClient.subscribe(new NotificationPullHandler());
		this.#pullClient.subscribe(new NotifierPullHandler());
		this.#pullClient.subscribe(new OnlinePullHandler());
		this.#pullClient.subscribe(new CounterPullHandler());
		this.#pullClient.subscribe(new AnchorPullHandler());
		this.#pullClient.subscribe(new SidebarPullHandler());
		this.#pullClient.subscribe(new StickersPullHandler());

		if (OpenLinesLaunchResources)
		{
			OpenLinesLaunchResources.pullHandlers.forEach((Handler) => {
				this.#pullClient.subscribe(new Handler());
			});
		}

		this.#pullClient.subscribe({
			type: BX.PullClient.SubscriptionType.Status,
			callback: this.#onPullStatusChange.bind(this),
		});

		return Promise.resolve();
	}

	#onPullStatusChange(data)
	{
		if (data.status === BX.PullClient.PullStatus.Online)
		{
			this.#offline = false;
		}
		else if (data.status === BX.PullClient.PullStatus.Offline)
		{
			this.#offline = true;
		}
	}
}

const Core = new CoreApplication();

export { Core, CoreApplication };
