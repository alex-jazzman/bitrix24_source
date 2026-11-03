/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_loader, ui_analytics, ui_buttons, ui_dialogs_messagebox, ui_infoHelper, ui_popupWithHeader) {
	'use strict';

	class Analytics {
		#code;
		#category;
		constructor(code, category) {
			this.#code = code;
			this.#category = category;
		}
		sendByEventName(event, additionalParameter = null) {
			ui_analytics.sendData({
				tool: 'InfoHelper',
				category: this.#category,
				type: this.#code,
				event: event,
				c_section: new main_core.Uri(document.location.href).getPath(),
				p1: additionalParameter
			});
		}
	}

	class BaseProvider {
		show(code, params) {
			throw new Error('Must be implemented in a child class');
		}
		close() {
			throw new Error('Must be implemented in a child class');
		}
	}

	class ProvidersType {
		static SLIDER = 'slider';
		static POPUP = 'popup';
	}

	class ProviderRequestFactory {
		#type;
		#code;
		#featureId;
		static controller = 'ui.infoHelper.getInitParams';
		constructor(configuration) {
			if (configuration.type === ProvidersType.SLIDER || configuration.type === ProvidersType.POPUP) {
				this.#type = configuration.type;
				this.#code = configuration.code ?? null;
				this.#featureId = configuration.featureId ?? null;
			} else {
				throw new Error("Invalid parameter 'type'");
			}
		}
		getRequest() {
			return main_core.ajax.runAction(ProviderRequestFactory.controller, {
				data: {
					type: this.#type,
					code: this.#code,
					currentUrl: window.location.href,
					featureId: this.#featureId
				}
			});
		}
	}

	class PopupProvider extends BaseProvider {
		#dataSource;
		#bindElement;
		#popup;
		#code;
		#analytics;
		constructor(config) {
			super();
			if (main_core.Type.isDomNode(config.bindElement)) {
				this.#bindElement = config.bindElement;
			} else {
				throw new Error("Invalid parameter 'bindElement'");
			}
			if (main_core.Type.isString(config.code)) {
				this.#code = config.code;
			} else {
				throw new Error("Invalid parameter 'code'");
			}
			if (config.dataSource && config.dataSource instanceof Promise) {
				this.#dataSource = config.dataSource;
			} else {
				const providerRequestFactoryConfiguration = {
					type: ProvidersType.POPUP,
					code: this.#code,
					featureId: config.featureId
				};
				this.#dataSource = new ProviderRequestFactory(providerRequestFactoryConfiguration).getRequest();
			}
			this.#analytics = new Analytics(config.analytics?.code ?? this.#code, ProvidersType.POPUP);
		}
		show(code, params) {
			this.#getPopup().show();
			this.#analytics.sendByEventName('show');
		}
		close() {
			this.#getPopup().close();
			this.#analytics.sendByEventName('close');
		}
		#getPopup() {
			if (!this.#popup) {
				const analyticsCallbackFunction = (event, additionalParameter) => {
					if (this.#analytics) {
						this.#analytics.sendByEventName(event, additionalParameter);
					}
				};
				this.#popup = new ui_popupWithHeader.PopupWithHeader({
					target: this.#bindElement,
					id: `demo-popup-components-maker-${Math.random(8)}`,
					width: 370,
					skeletonWidth: 370,
					content: [],
					asyncData: this.#dataSource,
					template: new ui_popupWithHeader.SaleTemplate({
						analyticsCallback: analyticsCallbackFunction
					}),
					analyticsCallback: analyticsCallbackFunction
				});
			}
			return this.#popup;
		}
	}

	class FeaturePromoter {
		#code;
		#provider;
		#options;
		#analytics;
		constructor(options) {
			if (!options.code && !options.featureId) {
				throw new Error("Either the 'code' parameter or the 'featureId' parameter is required");
			}
			this.#options = options;
			this.#options.bindElement = options.bindElement ?? null;
			this.#code = options.code ?? '';
			this.#analytics = options.analytics ?? null;
			const settings = main_core.Extension.getSettings('ui.info-helper');
			this.#provider = this.#createProvider(settings);
		}
		getOptions() {
			return this.#options;
		}
		getCode() {
			return this.#code;
		}
		getProvider() {
			return this.#provider;
		}
		getAnalytics() {
			return this.#analytics;
		}
		show(params = {}) {
			return this.#provider.show(this.#code, params);
		}
		close() {
			return this.#provider.close();
		}
		getBindElement() {
			return this.getOptions().bindElement;
		}
		#createProvider(settings) {
			if (main_core.Type.isObject(settings) && settings.popupProviderEnabled && main_core.Type.isDomNode(this.getOptions().bindElement) && (!this.getOptions().featureId || !settings.isUpgradeTariffAvailable)) {
				return new PopupProvider({
					bindElement: this.getOptions().bindElement,
					code: this.#code,
					analytics: this.#analytics,
					featureId: this.getOptions().featureId ?? null
				});
			} else {
				const provider = new SliderProvider({
					featureId: this.getOptions().featureId ?? null
				});
				ui_infoHelper.InfoHelper.sliderProviderForOldFormat ??= provider;
				return provider;
			}
		}
	}

	class FeaturePromotersRegistry {
		static #promoters = [];
		static register(promoter) {
			if (!FeaturePromotersRegistry.exist(promoter)) {
				FeaturePromotersRegistry.#promoters.push(promoter);
			}
		}
		static exist(promoter) {
			return FeaturePromotersRegistry.#promoters.find(savedPromoter => savedPromoter === promoter);
		}
		static getPromoter(config) {
			let promoter;
			FeaturePromotersRegistry.#promoters.forEach(savedPromoter => {
				let isSavedPromoter = true;
				Object.keys(savedPromoter.getOptions()).forEach(key => {
					if (savedPromoter.getOptions()[key] !== config[key]) {
						isSavedPromoter = false;
					}
				});
				if (isSavedPromoter) {
					promoter = savedPromoter;
				}
			});
			if (promoter instanceof FeaturePromoter) {
				return promoter;
			}
			promoter = new FeaturePromoter(config);
			FeaturePromotersRegistry.register(promoter);
			return promoter;
		}
		static getLastPromoter() {
			const count = this.#promoters.length;
			return this.#promoters[count - 1] ?? null;
		}
	}

	class Actions {
		static ClosePage() {
			BX.SidePanel.Instance.getTopSlider()?.close();
			BX.UI.InfoHelper.close();
		}
		static openPage() {
			window.location.href = BX.UI.InfoHelper.frameUrl;
		}
		static openPageInNewTab() {
			window.open(BX.UI.InfoHelper.frameUrl, '_blank');
		}
		static reloadParent() {
			BX.UI.InfoHelper.reloadParent();
		}
		static openSlider(data) {
			top.BX.SidePanel.Instance.open(data.url);
		}
		static openPriceTable(data) {
			let url = '/settings/license_all.php';
			if (data && data.subscr) {
				url = main_core.Uri.addParam(url, {
					subscr: data.subscr
				});
			}
			Actions.openSlider({
				url
			});
		}
		static openChatWithHead(data) {
			const opener = top.BX.Messenger.Public.openChat();
			const analyticData = {
				tool: 'InfoHelper',
				c_section: document.location.href,
				event: 'create_chatforrequest'
			};
			if (data.toolId) {
				main_core.ajax.runAction('intranet.tools.tool.createHeadChat', {
					data: {
						toolId: data.toolId
					}
				}).then(response => {
					opener.then(() => {
						top.BX.Messenger.Public.openChat(`chat${response.data.chatId}`);
					});
					analyticData.type = data.toolId;
					analyticData.category = 'tool_off';
					ui_analytics.sendData(analyticData);
				});
			}
			if (data.featureCode) {
				main_core.ajax.runAction('bitrix24.license.upgraderequest.createHeadChat', {
					data: {
						code: data.featureCode
					}
				}).then(response => {
					opener.then(() => {
						top.BX.Messenger.Public.openChat(`chat${response.data.chatId}`);
					});
					analyticData.type = data.featureCode;
					analyticData.category = 'limit';
					ui_analytics.sendData(analyticData);
				});
			}
		}
		static openCheckout(data) {
			if (data.tariff) {
				const url = main_core.Uri.addParam('/settings/order/make.php', {
					product: data.period ? data.tariff + data.period : `${data.tariff}12`,
					subscr: data.subscr ?? null
				});
				Actions.openSlider({
					url
				});
			} else if (main_core.Extension.getSettings('ui.info-helper').licenseType) {
				const url = main_core.Uri.addParam('/settings/order/make.php', {
					product: `${main_core.Extension.getSettings('ui.info-helper').licenseType}12`,
					subscr: data.subscr ?? null
				});
				Actions.openSlider({
					url
				});
			} else {
				this.openPriceTable(data);
			}
		}
		static openBaasCheckout(data) {
			const url = main_core.Uri.addParam('/settings/order/make.php', {
				product: `PACKAGE_${data.package}`
			});
			Actions.openSlider({
				url
			});
		}
		static openToolsSettings() {
			Actions.openSlider({
				url: main_core.Extension.getSettings('ui.info-helper').settingsUrl + '?page=tools'
			});
		}
		static openInformer(data) {
			top.BX.UI.InfoHelper.__showExternal(data.code, data.option);
		}
		static activateDemoSubscription(data) {
			if (data.licenseAgreed === 'Y') {
				const ajaxRestPath = '/bitrix/tools/rest.php';
				const callback = result => {
					const slider = BX.SidePanel.Instance.getTopSlider();
					if (slider && result.error) {
						BX.UI.InfoHelper.sliderProviderForOldFormat?.getFrame().contentWindow.postMessage({
							action: 'onActivateDemoSubscriptionResult',
							result: result
						}, '*');
					}
					if (!result.error) {
						let url = window.location.href;
						url += url.includes('?') ? '&' : '?';
						url += 'feature_promoter=limit_market_trial_active';
						window.location.href = url;
					}
				};
				BX.ajax({
					dataType: 'json',
					method: 'POST',
					url: ajaxRestPath,
					data: {
						action: 'activate_demo',
						sessid: BX.bitrix_sessid()
					},
					onsuccess: callback,
					onfailure: function (error_type, error) {
						callback({
							error: error_type + (error ? `: ${error}` : '')
						});
					}
				});
			}
		}
		static activateDemoLicense() {
			return main_core.ajax.runAction('ui.infoHelper.activateDemoLicense').then(response => Actions.#processDemoActivationResponse(response), () => Actions.#processDemoActivationResponse({
				data: {
					success: 'N',
					error: {
						message: main_core.Loc.getMessage('UI_INFO_HELPER_DEMO_LICENSE_ACTIVATION_FAILED')
					}
				}
			}));
		}
		static #processDemoActivationResponse(response) {
			Actions.#notifyDemoActivationResult(response);
			if (response.data.success === 'N' && response.data.error) {
				Actions.showDemoActivationError(response.data.error);
			}
			if (response.data.success === 'Y') {
				BX.onCustomEvent('BX.UI.InfoHelper:onActivateDemoLicenseSuccess', {
					result: response
				});
				window.location.reload();
			}
		}
		static #notifyDemoActivationResult(response) {
			if (!BX.SidePanel.Instance.getTopSlider()) {
				return;
			}
			const promoter = FeaturePromotersRegistry.getLastPromoter();
			const provider = promoter?.getProvider();
			const frame = provider instanceof SliderProvider && promoter?.getCode() === 'limit_demo' ? provider.getFrame() : BX.UI.InfoHelper.sliderProviderForOldFormat?.getFrame();
			frame?.contentWindow?.postMessage({
				action: 'onActivateDemoLicenseResult',
				result: response
			}, '*');
		}
		static showDemoActivationError(error) {
			const action = error.customData?.action;
			const hasAction = main_core.Type.isStringFilled(action?.title) && main_core.Type.isStringFilled(action?.code);
			const buttons = hasAction ? [this.#getHelperButton(action.title, action.code), this.#getCloseButton()] : [this.#getCloseButton(true)];
			new ui_dialogs_messagebox.MessageBox({
				useAirDesign: true,
				message: error.message,
				title: error.customData?.title,
				buttons,
				popupOptions: {
					closeByEsc: true,
					closeIcon: true
				}
			}).show();
		}
		static #getCloseButton(primary = false) {
			return new ui_buttons.CloseButton({
				color: primary ? ui_buttons.ButtonColor.PRIMARY : ui_buttons.ButtonColor.LINK,
				useAirDesign: true,
				wide: true,
				events: {
					click: button => {
						button.getContext().close();
					}
				}
			});
		}
		static #getHelperButton(title, code) {
			return new ui_buttons.Button({
				color: ui_buttons.ButtonColor.PRIMARY,
				text: title,
				useAirDesign: true,
				wide: true,
				onclick: button => {
					button.getContext().close();
					top.BX.Helper.show(`redirect=detail&code=${code}`);
				}
			});
		}
		static openBuySubscriptionPage() {
			main_core.ajax.runAction('ui.infoHelper.getBuySubscriptionUrl').then(response => {
				if (!!response.data && !!response.data.url) {
					if (response.data.action === 'blank') {
						window.open(response.data.url, '_blank');
					} else if (response.data.action === 'redirect') {
						window.location.href = response.data.url;
					}
				}
			});
		}
		static activateTrialFeature(data) {
			main_core.ajax.runAction('ui.infoHelper.activateTrialFeature', {
				data: {
					featureId: data.featureId
				}
			}).then(response => {
				const slider = BX.SidePanel.Instance.getTopSlider();
				if (slider) {
					BX.UI.InfoHelper.sliderProviderForOldFormat?.getFrame().contentWindow.postMessage({
						action: 'onActivateTrialFeature',
						result: response
					}, '*');
				}
				if (response.data.success === 'Y') {
					BX.onCustomEvent('BX.UI.InfoHelper:onActivateTrialFeatureSuccess', {
						result: response,
						featureId: data.featureId
						// featureId: this.featureId
					});
				}
			});
		}
	}

	class SliderProvider extends BaseProvider {
		constructor(params = {}) {
			super();
			this.frameUrlTemplate = params.frameUrlTemplate || '';
			this.frameUrl = main_core.Type.isStringFilled(params.frameUrl) ? params.frameUrl : '';
			this.width = main_core.Type.isNumber(params.width) ? params.width : 700;
			this.constructorParams = params;
			if (params.dataSource && params.dataSource instanceof Promise) {
				this.dataSource = params.dataSource;
			} else {
				const providerRequestFactoryConfiguration = {
					type: ProvidersType.SLIDER,
					code: null,
					featureId: params.featureId
				};
				this.dataSource = new ProviderRequestFactory(providerRequestFactoryConfiguration).getRequest();
			}
		}
		__showExternal(code, option) {
			let width = 700;
			const sliderId = `${this.getId()}:${code}`;
			const frame = this.#createFrameNode();
			if (!!option && !!option.width && option.width > 0) {
				width = option.width;
			}
			const contentCallback = slider => {
				return new Promise((resolve, reject) => {
					const providerRequestFactoryConfiguration = {
						type: ProvidersType.SLIDER
					};
					new ProviderRequestFactory(providerRequestFactoryConfiguration).getRequest().then(response => {
						if (!main_core.Type.isStringFilled(this.frameUrlTemplate)) {
							this.frameUrlTemplate = response.data?.frameUrlTemplate ?? '';
						}
						frame.src = this.#buildUrl(code);
						return this.#createContainerNode(this.getLoader(), frame);
					}).then(content => resolve(content));
				});
			};
			const provider = ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code
			}).getProvider();
			this.#openSlider({
				id: sliderId,
				contentCallback: contentCallback.bind(this),
				width: width,
				events: {
					onLoad: () => {
						provider.frameNode = frame;
						provider.frameUrl = frame.src;
						this.showFrame(frame);
					}
				}
			});
		}
		show(code, params) {
			if (this.isOpen()) {
				return;
			}
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			const width = main_core.Type.isNumber(params.width) && params.width > 0 ? params.width : this.width;
			if (!code && !params.featureId && !this.constructorParams.featureId && !this.constructorParams.dataSource) {
				return;
			}
			this.contentCallback = slider => {
				return new Promise((resolve, reject) => {
					if (this.hasOpen) {
						resolve(this.getContent());
					} else {
						this.dataSource.then(response => {
							const {
								data
							} = response;
							if (data.code) {
								code = data.code;
							}
							this.frameUrlTemplate = data.frameUrlTemplate;
							this.frameUrl = this.#buildUrl(code, params, data);
							if (this.getFrame().src !== this.frameUrl) {
								this.getFrame().src = this.frameUrl;
							}
							this.bindEvent(data.availableDomainList);
							this.hasOpen = true;
							return resolve(this.getContent());
						});
					}
				});
			};
			this.#openSlider({
				id: this.getId(),
				contentCallback: this.contentCallback,
				width,
				events: {
					onLoad: () => this.showFrame(),
					onClose: () => {
						main_core.Event.unbindAll(window, 'message');
						if (this.frameNode) {
							this.frameNode.contentWindow?.postMessage({
								action: 'onCloseWidget'
							}, '*');
						}
					}
				}
			});
		}
		bindEvent(availableDomainList) {
			BX.bind(top.window, 'message', BX.proxy(function (event) {
				if (!event.origin || !!event.origin && !availableDomainList.includes(event.origin)) {
					return;
				}
				if (!event.data || !main_core.Type.isObject(event.data)) {
					return;
				}
				const action = Actions[event.data.action];
				if (main_core.Type.isFunction(action)) {
					action(event.data);
				}
			}, this));
		}
		#openSlider(params) {
			BX.SidePanel.Instance.open(params.id, {
				contentCallback: params.contentCallback,
				width: params.width,
				loader: 'default-loader',
				cacheable: false,
				customRightBoundary: 0,
				events: params.events
			});
		}
		#buildUrl(code, params = {}, data = null) {
			let url = this.frameUrlTemplate.replace(/code/, code);
			if (params.featureId && main_core.Type.isArray(data.trialableFeatureList)) {
				url = main_core.Uri.addParam(url, {
					featureId: params.featureId,
					trialableFeatureList: data.trialableFeatureList.join(',')
				});
			}
			return url;
		}
		close() {
			const slider = this.getSlider();
			if (slider && slider.isOpen()) {
				slider.close();
			}
		}
		getContent() {
			if (this.content) {
				return this.content;
			}
			this.content = this.#createContainerNode(this.getLoader(), this.getFrame());
			return this.content;
		}
		#createContainerNode(loader, frame) {
			return BX.create('div', {
				attrs: {
					className: 'info-helper-container',
					id: 'info-helper-container'
				},
				children: [loader, frame]
			});
		}
		getId() {
			return 'ui:info_helper';
		}
		getFrame() {
			if (this.frameNode) {
				return this.frameNode;
			}
			this.frameNode = this.#createFrameNode();
			return this.frameNode;
		}
		hasFrameNode() {
			return main_core.Type.isElementNode(this.frameNode);
		}
		#createFrameNode() {
			return BX.create('iframe', {
				attrs: {
					className: 'info-helper-panel-iframe',
					src: 'about:blank'
				}
			});
		}
		showFrame(frame) {
			if (!frame) {
				frame = this.getFrame();
			}
			setTimeout(() => {
				frame.classList.add('info-helper-panel-iframe-show');
			}, 600);
		}
		getSlider() {
			return BX.SidePanel.Instance.getSlider(this.getId());
		}
		isOpen() {
			return this.getSlider() && this.getSlider().isOpen();
		}
		getLoader() {
			if (this.popupLoader) {
				return this.popupLoader;
			}
			const loader = new main_loader.Loader({
				target: BX('info-helper-container'),
				size: 100
			});
			loader.show();
			this.popupLoader = loader.data.container;
			return this.popupLoader;
		}
	}

	class InfoHelper {
		static init(params) {
			this.sliderProviderForOldFormat = new SliderProvider({
				width: 700,
				frameUrlTemplate: params.frameUrlTemplate
			});
		}
		static __showExternal(code, option) {
			if (!this.sliderProviderForOldFormat) {
				this.init({});
			}
			this.sliderProviderForOldFormat?.__showExternal(code, option);
		}
		static show(code, params) {
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			this.init({});
			this.sliderProviderForOldFormat?.show(code, params);
		}
		static close() {
			this.sliderProviderForOldFormat?.close();
		}
		static getContent() {
			return this.sliderProviderForOldFormat?.getContent();
		}
		static getFrame() {
			return this.sliderProviderForOldFormat?.getFrame();
		}
		static showFrame(frame) {
			this.sliderProviderForOldFormat?.showFrame(frame);
		}
		static getLoader() {
			return this.sliderProviderForOldFormat?.getLoader();
		}
		static getSliderId() {
			return this.sliderProviderForOldFormat?.getId();
		}
		static getSlider() {
			return this.sliderProviderForOldFormat?.getSlider();
		}
		static reloadParent() {
			let slider = false;
			const sliderTop = BX.SidePanel.Instance.getTopSlider();
			if (sliderTop) {
				slider = BX.SidePanel.Instance.getPreviousSlider(sliderTop);
			}
			if (slider) {
				slider.reload();
			} else {
				window.location.reload();
			}
		}
		static isOpen() {
			return this.sliderProviderForOldFormat?.isOpen();
		}
		static isInited() {
			return this.inited;
		}
	}

	class FeaturePromoterAutoBinder {
		static #elements;
		static #isLaunch;
		static #attributeName = 'data-feature-promoter';
		static launch() {
			if (!FeaturePromoterAutoBinder.#isLaunch) {
				FeaturePromoterAutoBinder.getElements().forEach(element => {
					main_core.Event.bind(element, 'click', event => {
						const code = event.target?.attributes?.getNamedItem(FeaturePromoterAutoBinder.#attributeName)?.value;
						if (code) {
							FeaturePromotersRegistry.getPromoter({
								code: code,
								bindElement: element
							}).show();
						}
					});
				});
				FeaturePromoterAutoBinder.#isLaunch = true;
			}
		}
		static getElements() {
			if (!FeaturePromoterAutoBinder.#elements) {
				FeaturePromoterAutoBinder.#elements = document.querySelectorAll(`[${FeaturePromoterAutoBinder.#attributeName}]`);
			}
			return FeaturePromoterAutoBinder.#elements;
		}
	}

	FeaturePromoterAutoBinder.launch();

	exports.FeaturePromoter = FeaturePromoter;
	exports.FeaturePromotersRegistry = FeaturePromotersRegistry;
	exports.InfoHelper = InfoHelper;

})(this.BX.UI = this.BX.UI || {}, BX, BX, BX.UI.Analytics, BX.UI, BX.UI.Dialogs, BX.UI, BX.UI);
//# sourceMappingURL=info-helper.bundle.js.map
