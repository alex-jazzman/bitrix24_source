/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_vue3, ui_vue3_vuex, pull_client, rest_client, im_v2_application_launch, im_v2_model, im_v2_provider_pull, imopenlines_v2_lib_launchResources) {
	'use strict';

	class CoreApplication {
		#initPromise = null;
		#store = null;
		#restClient = null;
		#pullClient = null;
		#host;
		#userId;
		#siteId;
		#languageId;
		#offline = false;
		#applicationData = {};
		constructor() {
			this.#prepareVariables();
			this.#initRestClient();
		}
		ready() {
			if (!this.#initPromise) {
				this.#initPromise = this.#init();
			}
			return this.#initPromise;
		}
		createVue(application, config = {}) {
			const initConfig = {};
			if (config.el) {
				initConfig.el = config.el;
			}
			if (config.template) {
				initConfig.template = config.template;
			}
			if (config.name) {
				initConfig.name = config.name;
			}
			if (config.components) {
				initConfig.components = config.components;
			}
			if (config.data) {
				initConfig.data = config.data;
			}
			return new Promise(resolve => {
				initConfig.created = function () {
					if (main_core.Type.isFunction(config.created)) {
						config.created.call(this);
					}
					resolve(this);
				};
				const bitrixVue = ui_vue3.BitrixVue.createApp(initConfig);
				bitrixVue.config.errorHandler = function (err, vm, info) {
					// eslint-disable-next-line no-console
					console.error(err, vm, info);
					if (main_core.Type.isFunction(config.onError)) {
						config.onError(err);
					}
				};
				bitrixVue.config.warnHandler = function (warn, vm, trace) {
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
		getHost() {
			return this.#host;
		}
		getUserId() {
			return this.#userId;
		}
		getSiteId() {
			return this.#siteId;
		}
		getLanguageId() {
			return this.#languageId;
		}
		getStore() {
			return this.#store;
		}
		getRestClient() {
			return this.#restClient;
		}
		getPullClient() {
			return this.#pullClient;
		}
		setApplicationData(data) {
			this.#applicationData = {
				...this.#applicationData,
				...data
			};
		}
		getApplicationData() {
			return this.#applicationData;
		}
		isOnline() {
			return !this.#offline;
		}
		isCloud() {
			const settings = main_core.Extension.getSettings('im.v2.application.core');
			return settings.get('isCloud');
		}
		async #init() {
			try {
				await this.#initStorage();
				await this.#initPull();
				return this;
			} catch (error) {
				console.error('Core: error starting core application', error);
				throw error;
			}
		}
		#prepareVariables() {
			this.#host = location.origin;
			this.#userId = Number.parseInt(main_core.Loc.getMessage('USER_ID'), 10) ?? 0;
			this.#siteId = main_core.Loc.getMessage('SITE_ID') ?? 's1';
			this.#languageId = main_core.Loc.getMessage('LANGUAGE_ID') ?? 'en';
		}
		#initRestClient() {
			this.#restClient = BX.rest;
		}
		async #initStorage() {
			const builder = ui_vue3_vuex.Builder.init().addModel(im_v2_model.ApplicationModel.create()).addModel(im_v2_model.MessagesModel.create()).addModel(im_v2_model.ChatsModel.create()).addModel(im_v2_model.FilesModel.create()).addModel(im_v2_model.UsersModel.create()).addModel(im_v2_model.RecentModel.create()).addModel(im_v2_model.CountersModel.create()).addModel(im_v2_model.NotificationsModel.create()).addModel(im_v2_model.SidebarModel.create()).addModel(im_v2_model.MarketModel.create()).addModel(im_v2_model.CopilotModel.create()).addModel(im_v2_model.StickersModel.create()).addModel(im_v2_model.AiAssistantModel.create());
			if (imopenlines_v2_lib_launchResources.OpenLinesLaunchResources) {
				imopenlines_v2_lib_launchResources.OpenLinesLaunchResources.models.forEach(model => {
					builder.addModel(model.create());
				});
			}
			const buildResult = await builder.build();
			this.#store = buildResult.store;
		}
		#initPull() {
			this.#pullClient = BX.PULL;
			if (!this.#pullClient) {
				return Promise.reject(new Error('Core: error setting pull client'));
			}
			this.#pullClient.subscribe(new im_v2_provider_pull.BasePullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.RecentPullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.NotificationPullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.NotifierPullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.OnlinePullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.CounterPullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.RecentUnreadPullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.AnchorPullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.SidebarPullHandler());
			this.#pullClient.subscribe(new im_v2_provider_pull.StickersPullHandler());
			if (imopenlines_v2_lib_launchResources.OpenLinesLaunchResources) {
				imopenlines_v2_lib_launchResources.OpenLinesLaunchResources.pullHandlers.forEach(Handler => {
					this.#pullClient.subscribe(new Handler());
				});
			}
			this.#pullClient.subscribe({
				type: BX.PullClient.SubscriptionType.Status,
				callback: this.#onPullStatusChange.bind(this)
			});
			return Promise.resolve();
		}
		#onPullStatusChange(data) {
			if (data.status === BX.PullClient.PullStatus.Online) {
				this.#offline = false;
			} else if (data.status === BX.PullClient.PullStatus.Offline) {
				this.#offline = true;
			}
		}
	}
	const Core = new CoreApplication();

	exports.Core = Core;
	exports.CoreApplication = CoreApplication;

})(this.BX.Messenger.v2.Application = this.BX.Messenger.v2.Application || {}, BX??{}, BX?.Vue3??{}, BX?.Vue3?.Vuex??{}, BX??{}, BX??{}, BX?.Messenger?.v2?.Application??{}, BX?.Messenger?.v2?.Model??{}, BX?.Messenger?.v2?.Provider?.Pull??{}, BX?.OpenLines?.v2?.Lib??{});
//# sourceMappingURL=core.bundle.js.map
