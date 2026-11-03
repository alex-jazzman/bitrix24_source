/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_bannerDispatcher) {
	'use strict';

	const PREPARE_DIGEST_SETUP_ACTION = 'biconnector.dashboard.prepareDigestSetup';
	class Api {
		#runAction;
		constructor(runAction = (...args) => main_core.ajax.runAction(...args)) {
			this.#runAction = runAction;
		}
		async prepareDigestSetup(dashboardId, screenState) {
			const response = await this.#runAction(PREPARE_DIGEST_SETUP_ACTION, {
				data: this.#buildRequestData(dashboardId, screenState)
			});
			return response.data;
		}
		#buildRequestData(dashboardId, screenState) {
			if (dashboardId === undefined) {
				return {};
			}
			return screenState ? {
				dashboardId,
				screenState
			} : {
				dashboardId
			};
		}
	}
	const api = new Api();

	const SETUP_TEMPLATE_EXTENSION = 'bizproc.setup-template';
	class SetupTemplateOpener {
		#loadSetupTemplate;
		#loading = null;
		constructor(loadSetupTemplate = () => main_core.Runtime.loadExtension(SETUP_TEMPLATE_EXTENSION)) {
			this.#loadSetupTemplate = loadSetupTemplate;
		}
		preload() {
			void this.#load();
		}
		async open(data) {
			const setupTemplate = await this.#load();
			setupTemplate.showSidePanel(data);
		}
		#load() {
			if (!this.#loading) {
				const loading = this.#loadSetupTemplate().then(({
					SetupTemplate
				}) => {
					if (!SetupTemplate) {
						throw new Error(`${SETUP_TEMPLATE_EXTENSION} is not available`);
					}
					return SetupTemplate;
				});
				loading.catch(() => {
					if (this.#loading === loading) {
						this.#loading = null;
					}
				});
				this.#loading = loading;
			}
			return this.#loading;
		}
	}
	const setupTemplateOpener = new SetupTemplateOpener();

	const ERROR_MESSAGE_CODE = 'BICONNECTOR_AI_DIGEST_SETUP_ERROR';
	const defaultDependencies$1 = {
		openPromoter: code => {
			const loading = main_core.Runtime.loadExtension('ui.info-helper');
			void loading.then(({
				InfoHelper
			}) => InfoHelper.show(code));
		},
		showError: () => {
			const loading = main_core.Runtime.loadExtension('ui.notification');
			void loading.then(({
				Center
			}) => Center.notify({
				content: main_core.Loc.getMessage(ERROR_MESSAGE_CODE) ?? ''
			}));
		},
		openSetup: data => setupTemplateOpener.open(data)
	};
	class ResultHandler {
		#dependencies;
		constructor(dependencies = defaultDependencies$1) {
			this.#dependencies = dependencies;
		}
		canStart(availability) {
			if (availability.state === 'ready') {
				return true;
			}
			if (availability.state === 'subscription_required') {
				this.#showPromoter(availability.promoterCode);
			}
			return false;
		}
		async handle(result) {
			if (result.state === 'ready' && result.setupTemplateData) {
				await this.#dependencies.openSetup(result.setupTemplateData);
				return;
			}
			if (result.state === 'subscription_required' && this.#showPromoter(result.promoterCode)) {
				return;
			}
			this.#dependencies.showError();
		}
		handleFailure() {
			this.#dependencies.showError();
		}
		#showPromoter(code) {
			if (!code) {
				this.#dependencies.showError();
				return false;
			}
			this.#dependencies.openPromoter(code);
			return true;
		}
	}
	const resultHandler = new ResultHandler();

	const SCREEN_STATE_TIMEOUT_MS = 700;
	const NATIVE_FILTER_ID_PATTERN = /^NATIVE_FILTER-[\w-]{1,64}$/;
	const MAX_SCREEN_STATE_FILTERS = 50;
	const MAX_SCREEN_STATE_BYTES = 16384;
	const SCREEN_STATE_KEYS = ['extraFormData', 'filterState'];
	const MAX_INPUT_NESTING_LEVEL = 64;
	const SHORT_ESCAPED_CHARS = new Set(['\\', '/', '\b', '\f', '\n', '\r', '\t']);
	const UNICODE_ESCAPED_CHAR = /^[\u0000-\u001F"&'<>\u2028\u2029]$/;
	async function takeScreenState(bridge) {
		if (!main_core.Type.isFunction(bridge?.getDataMask)) {
			return null;
		}
		const cancellation = new AbortController();
		const timeout = new Promise(resolve => {
			main_core.Event.bind(cancellation.signal, 'abort', () => resolve(null));
		});
		const timer = setTimeout(() => cancellation.abort(), SCREEN_STATE_TIMEOUT_MS);
		try {
			const dataMask = await Promise.race([bridge.getDataMask(cancellation.signal), timeout]);
			return narrowToNativeFilters(dataMask);
		} catch {
			return null;
		} finally {
			clearTimeout(timer);
			cancellation.abort();
		}
	}
	function narrowToNativeFilters(dataMask) {
		if (!main_core.Type.isPlainObject(dataMask)) {
			return null;
		}
		const screenState = {};
		Object.entries(dataMask).forEach(([filterId, state]) => {
			if (!NATIVE_FILTER_ID_PATTERN.test(filterId) || !main_core.Type.isPlainObject(state)) {
				return;
			}
			const parts = {};
			SCREEN_STATE_KEYS.forEach(key => {
				if (main_core.Type.isPlainObject(state[key])) {
					parts[key] = state[key];
				}
			});
			if (Object.keys(parts).length > 0) {
				screenState[filterId] = parts;
			}
		});
		const received = receiveAsFormField(screenState, 0);
		if (!Array.isArray(received) || received.length > MAX_SCREEN_STATE_FILTERS) {
			return null;
		}
		return measureEncodedLength(received) > MAX_SCREEN_STATE_BYTES ? null : screenState;
	}
	function receiveAsFormField(value, level) {
		if (main_core.Type.isNull(value)) {
			return null;
		}
		if (!main_core.Type.isObjectLike(value)) {
			if (level > MAX_INPUT_NESTING_LEVEL) {
				throw new RangeError('Screen state is nested too deep for the backend');
			}
			return decodeURIComponent(encodeURIComponent(value));
		}
		const entries = [];
		Object.keys(value).forEach(key => {
			const field = receiveAsFormField(value[key], level + 1);
			if (field !== null) {
				entries.push([decodeURIComponent(encodeURIComponent(key)), field]);
			}
		});
		return entries.length > 0 ? entries : null;
	}
	function measureEncodedLength(field) {
		if (main_core.Type.isString(field)) {
			return measureEncodedString(field);
		}
		const isList = field.every(([key], index) => key === String(index));
		const itemsLength = field.reduce((length, [key, value]) => {
			const keyLength = isList ? 0 : measureEncodedString(key) + 1;
			return length + keyLength + measureEncodedLength(value);
		}, 0);
		return 2 + itemsLength + Math.max(field.length - 1, 0);
	}
	function measureEncodedString(value) {
		let length = 2;
		for (const char of value) {
			length += measureEncodedChar(char);
		}
		return length;
	}
	function measureEncodedChar(char) {
		if (SHORT_ESCAPED_CHARS.has(char)) {
			return 2;
		}
		if (UNICODE_ESCAPED_CHAR.test(char)) {
			return 6;
		}
		const codePoint = char.codePointAt(0) ?? 0;
		if (codePoint < 0x80) {
			return 1;
		}
		if (codePoint < 0x800) {
			return 2;
		}
		return codePoint < 0x10000 ? 3 : 4;
	}

	class AiDigestSetup {
		static #requests = new Map();
		static async open(options) {
			if (!resultHandler.canStart(options.availability)) {
				return;
			}
			setupTemplateOpener.preload();
			const {
				dashboardId,
				bridge
			} = options;
			let request = AiDigestSetup.#requests.get(dashboardId);
			if (!request) {
				request = AiDigestSetup.#prepare(dashboardId, bridge);
				AiDigestSetup.#requests.set(dashboardId, request);
			}
			await request;
		}
		static async #prepare(dashboardId, bridge) {
			try {
				const screenState = dashboardId === undefined || !bridge ? null : await takeScreenState(bridge);
				const result = await (screenState ? api.prepareDigestSetup(dashboardId, screenState) : api.prepareDigestSetup(dashboardId));
				await resultHandler.handle(result);
			} catch {
				resultHandler.handleFailure();
			} finally {
				AiDigestSetup.#requests.delete(dashboardId);
			}
		}
	}

	const IMAGE_PATH = '/bitrix/js/biconnector/ai-digest-setup/images/';
	const SCENE_ASPECT = 593 / 520;
	const SCENE_LAYERS = Object.freeze([{
		src: 'onboarding-back.webp',
		depth: 1,
		shift: 3,
		period: 11
	}, {
		src: 'onboarding-icons.webp',
		depth: 4,
		shift: 8,
		period: 5
	}, {
		src: 'onboarding-mascot.webp',
		depth: 3,
		shift: 4,
		period: 7
	}]);
	const createOnboardingDialog = (modules, handlers) => {
		const {
			WhatsNew,
			WhatsNewSize,
			WhatsNewBackdrop,
			WhatsNewColor,
			Button,
			AirButtonStyle,
			ButtonSize,
			Outline
		} = modules;
		let dialog = null;
		const createButton = (text, style, testId, onPress) => {
			return new Button({
				text,
				style,
				size: ButtonSize.LARGE,
				useAirDesign: true,
				dataset: {
					testid: testId
				},
				onclick: () => {
					dialog?.hide();
					onPress();
					return {};
				}
			});
		};
		const laterButton = createButton(main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_LATER'), AirButtonStyle.PLAIN, 'biconnector-ai-digest-onboarding-later', () => {});
		const tryButton = createButton(main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_TRY_MSGVER_1'), AirButtonStyle.FILLED_SUCCESS, 'biconnector-ai-digest-onboarding-try', handlers.onTry);
		const preparedDialog = new WhatsNew({
			size: WhatsNewSize.Md,
			backdrop: WhatsNewBackdrop.Water,
			backdropColor: WhatsNewColor.DarkBlue,
			label: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_LABEL'),
			title: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_TITLE_MSGVER_1'),
			subtitle: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_SUBTITLE'),
			scene: {
				aspect: SCENE_ASPECT,
				layers: SCENE_LAYERS.map(layer => ({
					...layer,
					src: `${IMAGE_PATH}${layer.src}`
				}))
			},
			items: [{
				icon: Outline.GRAPHS_DIAGRAM,
				title: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_REPORT_TITLE'),
				description: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_REPORT_TEXT'),
				accent: true
			}, {
				icon: Outline.CLOCK,
				title: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_SCHEDULE_TITLE'),
				description: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_SCHEDULE_TEXT'),
				accent: true
			}, {
				icon: Outline.CIRCLE_MORE,
				title: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_MENU_TITLE'),
				description: main_core.Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_MENU_TEXT'),
				accent: true
			}],
			actions: [laterButton, tryButton],
			closeByClickOutside: false,
			events: {
				onAfterShow: () => tryButton.getContainer().focus(),
				onAfterHide: () => {
					preparedDialog.destroy();
					handlers.onClose();
				}
			}
		});
		dialog = preparedDialog;
		return () => preparedDialog.show();
	};

	const CLAIM_ACTION = 'biconnector.dashboard.claimDigestSetupOnboarding';
	const QUEUE_ITEM_PREFIX = 'biconnector-ai-digest-onboarding';
	const pickDialogModules = (whatsNew, buttons, iconSet) => {
		return {
			WhatsNew: whatsNew.WhatsNew,
			WhatsNewSize: whatsNew.WhatsNewSize,
			WhatsNewBackdrop: whatsNew.WhatsNewBackdrop,
			WhatsNewColor: whatsNew.WhatsNewColor,
			Button: buttons.Button,
			AirButtonStyle: buttons.AirButtonStyle,
			ButtonSize: buttons.ButtonSize,
			Outline: iconSet.Outline
		};
	};
	const prepareDialog = (onTry, onClose) => {
		return Promise.all([main_core.Runtime.loadExtension('ui.system.popups.whats-new'), main_core.Runtime.loadExtension('ui.buttons'), main_core.Runtime.loadExtension('ui.icon-set.api.core')]).then(([whatsNew, buttons, iconSet]) => {
			return createOnboardingDialog(pickDialogModules(whatsNew, buttons, iconSet), {
				onTry,
				onClose
			});
		});
	};
	const defaultDependencies = {
		toQueue: (callback, options) => ui_bannerDispatcher.BannerDispatcher.normal.toQueue(callback, options),
		claim: async version => {
			const response = await main_core.ajax.runAction(CLAIM_ACTION, {
				data: {
					version
				}
			});
			return response.data?.claimed === true;
		},
		prepareDialog,
		openSetup: options => {
			void AiDigestSetup.open(options);
		}
	};
	class Onboarding {
		#dependencies;
		constructor(dependencies = defaultDependencies) {
			this.#dependencies = dependencies;
		}
		enqueue(options) {
			this.#dependencies.toQueue(onDone => {
				void this.#claimAndShow(options, () => onDone());
				return {};
			}, {
				id: `${QUEUE_ITEM_PREFIX}-${options.version}`
			});
		}
		async #claimAndShow(options, onDone) {
			let isCompleted = false;
			const complete = () => {
				if (isCompleted) {
					return;
				}
				isCompleted = true;
				onDone();
			};
			try {
				const showDialog = await this.#dependencies.prepareDialog(() => this.#dependencies.openSetup({
					availability: options.availability
				}), complete);
				if (!(await this.#dependencies.claim(options.version))) {
					complete();
					return;
				}
				showDialog();
			} catch {
				complete();
			}
		}
	}

	class AiDigestOnboarding {
		static #onboarding = new Onboarding();
		static enqueue(options) {
			AiDigestOnboarding.#onboarding.enqueue(options);
		}
	}

	exports.AiDigestOnboarding = AiDigestOnboarding;
	exports.AiDigestSetup = AiDigestSetup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI);
//# sourceMappingURL=ai-digest-setup.bundle.js.map
