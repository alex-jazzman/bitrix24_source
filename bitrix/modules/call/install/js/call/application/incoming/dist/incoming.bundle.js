/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, main_core_events, main_popup, ui_vue3, ui_vue3_pinia, call_adapter_desktopApi, call_plugin_loc, call_mapping, call_store, call_component_view_incoming) {
	'use strict';

	const Vue = ui_vue3.BitrixVue;
	let instanceCounter = 0;
	const DIALOG_NAME_PHRASE = Object.freeze({
		regular: 'CALL_INCOMING_DIALOG_ARIA',
		conference: 'CALL_INCOMING_CONFERENCE_DIALOG_ARIA'
	});
	const escapeJsonForScript = json => {
		return json.replaceAll('<', '\\u003C').replaceAll('>', '\\u003E').replaceAll('&', '\\u0026').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
	};
	function resolveIncomingPhrase(id, replacements) {
		return main_core.Loc.getMessage(id, replacements) || id;
	}
	function buildIncomingDialogName(callType, callerName) {
		const phraseCode = callType === 'conference' ? DIALOG_NAME_PHRASE.conference : DIALOG_NAME_PHRASE.regular;
		const decodedName = main_core.Text.decode(callerName ?? '');
		return main_core.Loc.getMessage(phraseCode, {
			'#NAME#': decodedName
		}) || decodedName;
	}
	function applyIncomingDocumentAttributes(targetDocument, {
		lang,
		title
	} = {}) {
		if (!targetDocument) {
			return;
		}
		if (main_core.Type.isStringFilled(lang)) {
			targetDocument.documentElement?.setAttribute('lang', lang);
		}
		if (main_core.Type.isStringFilled(title)) {
			targetDocument.title = title;
		}
	}
	class IncomingCall extends main_core_events.EventEmitter {
		static Events = call_mapping.IncomingCallEvent;
		static mount(container, props) {
			const pinia = ui_vue3_pinia.createPinia();
			const rootComponent = {
				name: 'CallIncomingApplication',
				components: {
					CallIncoming: call_component_view_incoming.CallIncoming
				},
				methods: {
					onButtonClick(data) {
						call_adapter_desktopApi.DesktopApi.emitToMainWindow(call_mapping.IncomingCallInternalEvent.onButtonClick, [data]);
					}
				},
				template: '<CallIncoming @button-click="onButtonClick" />'
			};
			const app = Vue.createApp(rootComponent);
			app.use(call_plugin_loc.LocPlugin, {
				getMessage: resolveIncomingPhrase,
				languageId: props.languageId ?? 'ru'
			});
			app.use(pinia);
			const store = call_store.useCallIncomingStore(pinia);
			store.initFromParams(props);
			const onSetHasCamera = event => {
				const data = event?.data ?? event;
				store.setHasCamera(data.hasCamera);
			};
			call_adapter_desktopApi.DesktopApi.subscribe(call_mapping.IncomingCallInternalEvent.setHasCamera, onSetHasCamera);
			app.mount(container);
			applyIncomingDocumentAttributes(container.ownerDocument, {
				lang: props.lang,
				title: props.title
			});
			const cardRoot = container.firstElementChild;
			if (cardRoot instanceof HTMLElement) {
				cardRoot.focus();
			}
			call_adapter_desktopApi.DesktopApi.emitToMainWindow(call_mapping.IncomingCallInternalEvent.contentReady);
			if (props.callType === 'regular') {
				const broadcastChannel = new BroadcastChannel('IncomingNotification');
				broadcastChannel.postMessage({
					type: 'desktopWindowIsReady'
				});
				broadcastChannel.close();
			}
			return {
				unmount: () => {
					call_adapter_desktopApi.DesktopApi.unsubscribe(call_mapping.IncomingCallInternalEvent.setHasCamera, onSetHasCamera);
					app.unmount();
				}
			};
		}
		#contentReadyHandler;
		#buttonClickHandler;
		#config;
		#callType;
		#popup;
		#app;
		#pinia;
		#store;
		#resizeHandler;
		#desktopWindow;
		#desktopWindowReady;
		#postponedEvents;
		#broadcastChannel;
		#popupId;
		constructor(config) {
			super();
			this.setEventNamespace('BX.Call.IncomingCall');
			this.#config = config;
			this.#callType = config.callType ?? 'regular';
			this.#popup = null;
			this.#app = null;
			this.#pinia = null;
			this.#store = null;
			this.#resizeHandler = null;
			this.#desktopWindow = null;
			this.#desktopWindowReady = false;
			this.#postponedEvents = [];
			this.#broadcastChannel = null;
			this.#contentReadyHandler = this.#onDesktopContentReady.bind(this);
			this.#buttonClickHandler = this.#onDesktopButtonClick.bind(this);
			instanceCounter += 1;
			this.#popupId = `bx-call-incoming-${instanceCounter}`;
			if (main_core.Type.isFunction(config.onClose)) {
				this.subscribe(call_mapping.IncomingCallEvent.onClose, config.onClose);
			}
			if (main_core.Type.isFunction(config.onDestroy)) {
				this.subscribe(call_mapping.IncomingCallEvent.onDestroy, config.onDestroy);
			}
			if (main_core.Type.isFunction(config.onButtonClick)) {
				this.subscribe(call_mapping.IncomingCallEvent.onButtonClick, config.onButtonClick);
			}
		}
		show() {
			if (call_adapter_desktopApi.DesktopApi.isChatWindow()) {
				this.#showInDesktop();
				return;
			}
			this.#showInWeb();
		}
		setHasCamera(hasCamera) {
			if (this.#callType !== 'regular') {
				return;
			}
			if (this.#store !== null) {
				this.#store.setHasCamera(hasCamera);
			}
			if (call_adapter_desktopApi.DesktopApi.isChatWindow() || this.#desktopWindow !== null) {
				if (this.#desktopWindowReady) {
					call_adapter_desktopApi.DesktopApi.emit(call_mapping.IncomingCallInternalEvent.setHasCamera, [{
						hasCamera
					}]);
				} else {
					this.#postponedEvents.push({
						event: call_mapping.IncomingCallInternalEvent.setHasCamera,
						data: {
							hasCamera
						}
					});
				}
			}
		}
		close() {
			if (this.#popup) {
				this.#popup.close();
			}
			if (this.#desktopWindow) {
				this.#desktopWindow.BXDesktopWindow.ExecuteCommand('hide');
				if (call_adapter_desktopApi.DesktopApi.getApiVersion() >= 76) {
					this.#desktopWindow.BXDesktopWindow.ExecuteCommand('close');
					this.#desktopWindow = null;
					this.#desktopWindowReady = false;
				}
			}
			this.emit(call_mapping.IncomingCallEvent.onClose, {});
		}
		destroy() {
			if (this.#resizeHandler) {
				main_core.Event.unbind(window, 'resize', this.#resizeHandler);
				this.#resizeHandler = null;
			}
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
			if (this.#popup) {
				this.#popup.destroy();
				this.#popup = null;
			}
			if (this.#broadcastChannel) {
				this.#broadcastChannel.close();
				this.#broadcastChannel = null;
			}
			call_adapter_desktopApi.DesktopApi.unsubscribe(call_mapping.IncomingCallInternalEvent.contentReady, this.#contentReadyHandler);
			call_adapter_desktopApi.DesktopApi.unsubscribe(call_mapping.IncomingCallInternalEvent.onButtonClick, this.#buttonClickHandler);
			if (this.#desktopWindow) {
				this.#desktopWindow.BXDesktopWindow.ExecuteCommand('close');
				this.#desktopWindow = null;
			}
			this.#store = null;
			this.#pinia = null;
			this.emit(call_mapping.IncomingCallEvent.onDestroy, {});
		}
		onResize() {
			const maxHeight = document.body.clientHeight;
			if (this.#popup) {
				this.#popup.setMaxHeight(maxHeight);
			}
		}
		#showInWeb() {
			const mountContainer = document.createElement('div');
			this.#popup = new main_popup.Popup({
				id: this.#popupId,
				autoHide: false,
				draggable: true,
				closeByEsc: false,
				overlay: {
					color: '#000000',
					opacity: 30
				},
				borderRadius: 14,
				zIndex: this.#config.zIndex,
				content: mountContainer,
				padding: 0,
				focusTrap: true,
				ariaLabel: this.#getDialogName(),
				events: {
					onPopupDestroy: () => {
						this.#app?.unmount();
					}
				}
			});
			this.#pinia = ui_vue3_pinia.createPinia();
			const rootComponent = {
				name: 'CallIncomingApplication',
				components: {
					CallIncoming: call_component_view_incoming.CallIncoming
				},
				methods: {
					onButtonClick: data => this.#onVueButtonClick(data)
				},
				template: ' <CallIncoming @button-click="onButtonClick" /> '
			};
			this.#app = Vue.createApp(rootComponent);
			this.#app.use(call_plugin_loc.LocPlugin, {
				getMessage: resolveIncomingPhrase,
				languageId: main_core.Loc.getMessage('LANGUAGE_ID') ?? 'en'
			});
			this.#app.use(this.#pinia);
			this.#store = call_store.useCallIncomingStore(this.#pinia);
			this.#store.initFromParams(this.#config);
			this.#app.mount(mountContainer);
			this.#popup.show();
			this.#resizeHandler = this.onResize.bind(this);
			main_core.Event.bind(window, 'resize', this.#resizeHandler);
			this.onResize();
		}
		#getDialogName() {
			return buildIncomingDialogName(this.#callType, this.#config.callerName);
		}
		#onVueButtonClick(eventData) {
			this.emit(call_mapping.IncomingCallEvent.onButtonClick, eventData);
		}
		#showInDesktop() {
			if (this.#desktopWindow) {
				this.#desktopWindow.BXDesktopWindow.ExecuteCommand('show');
				return;
			}
			call_adapter_desktopApi.DesktopApi.subscribe(call_mapping.IncomingCallInternalEvent.contentReady, this.#contentReadyHandler);
			call_adapter_desktopApi.DesktopApi.subscribe(call_mapping.IncomingCallInternalEvent.onButtonClick, this.#buttonClickHandler);
			if (this.#callType === 'regular') {
				this.#broadcastChannel = new BroadcastChannel('IncomingNotification');
				this.#broadcastChannel.onmessage = event => {
					if (event.data?.type === 'desktopWindowIsReady') {
						this.#setDesktopWindowDimensions();
					}
				};
			}
			const props = {
				callType: this.#config.callType,
				callerName: this.#config.callerName,
				callerAvatar: this.#config.callerAvatar ?? '',
				callerType: this.#config.callerType ?? '',
				callerColor: this.#config.callerColor ?? '#525252',
				video: this.#config.video ?? false,
				hasCamera: this.#config.hasCamera ?? false,
				microphoneState: this.#config.microphoneState ?? true,
				cameraState: this.#config.cameraState ?? false,
				isDesktop: true,
				languageId: main_core.Loc.getMessage('LANGUAGE_ID') ?? 'en',
				lang: document.documentElement?.lang,
				title: this.#getDialogName()
			};
			const propsJson = escapeJsonForScript(JSON.stringify(props));
			const js = `
			BX.Runtime.loadExtension('call.application.incoming').then(function(exports) {
				var container = document.createElement('div');
				document.body.appendChild(container);
				exports.IncomingCall.mount(container, ${propsJson});
			});
		`;
			this.#desktopWindow = call_adapter_desktopApi.DesktopApi.createTopmostWindow(call_adapter_desktopApi.DesktopApi.prepareHtml('', js));
		}
		#onDesktopContentReady() {
			this.#desktopWindowReady = true;
			this.#setDesktopWindowDimensions();
			this.#postponedEvents.forEach(item => {
				call_adapter_desktopApi.DesktopApi.emit(item.event, [item.data]);
			});
			this.#postponedEvents = [];
		}
		#onDesktopButtonClick(event) {
			const data = event?.data ?? event;
			this.emit(call_mapping.IncomingCallEvent.onButtonClick, data);
		}
		#setDesktopWindowDimensions() {
			if (!this.#desktopWindow) {
				return;
			}
			const width = 352;
			const height = 495;
			this.#desktopWindow.BXDesktopWindow?.SetProperty?.('position', {
				X: 'STP_CENTER',
				Y: 'STP_VCENTER',
				Width: width,
				Height: height
			});
		}
	}

	exports.IncomingCall = IncomingCall;

})(this.BX.Call.Application = this.BX.Call.Application || {}, BX, BX.Event, BX.Main, BX.Vue3, BX.Vue3.Pinia, BX.Call.Adapter, BX.Call.Plugin, BX.Call.Mapping, BX.Call.Store, BX.Call.Component.View);
//# sourceMappingURL=incoming.bundle.js.map
