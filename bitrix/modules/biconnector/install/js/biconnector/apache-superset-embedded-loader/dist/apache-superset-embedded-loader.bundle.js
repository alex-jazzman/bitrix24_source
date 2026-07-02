/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class SwitchboardAction {
		static GET = 'get';
		static REPLY = 'reply';
		static EMIT = 'emit';
		static ERROR = 'error';
	}

	/**
	 * A utility for communications between an iframe and its parent, used by the Expertbridge embedded SDK.
	 * This builds useful patterns on top of the basic functionality offered by MessageChannel.
	 *
	 * Both windows instantiate a Switchboard, passing in their MessagePorts.
	 * Calling methods on the switchboard causes messages to be sent through the channel.
	 */
	class Switchboard {
		port = null;
		name = '';
		methods = [];
		incrementor = 1;
		debugMode = false;
		constructor({
			port,
			name = 'switchboard',
			debug = false
		}) {
			this.port = port;
			this.name = name;
			this.debugMode = debug;
			main_core.Event.bind(this.port, 'message', async event => {
				this.log('message received', event);
				const message = event.data;
				if (this.isGet(message)) {
					// find the method, call it, and reply with the result
					this.port.postMessage(await this.getMethodResult(message));
				} else if (this.isEmit(message)) {
					const {
						method,
						args
					} = message;
					const executor = this.methods[method];
					if (executor) {
						executor(args);
					}
				}
			});
			this.port.start();
		}
		async getMethodResult({
			messageId,
			method,
			args
		}) {
			const executor = this.methods[method];
			if (executor == null) {
				return {
					switchboardAction: SwitchboardAction.ERROR,
					messageId,
					error: `[${this.name}] Method "${method}" is not defined`
				};
			}
			try {
				const result = await executor(args);
				return {
					switchboardAction: SwitchboardAction.REPLY,
					messageId,
					result
				};
			} catch (err) {
				this.logError(err);
				return {
					switchboardAction: SwitchboardAction.ERROR,
					messageId,
					error: `[${this.name}] Method "${method}" threw an error`
				};
			}
		}

		/**
		 * Defines a method that can be "called" from the other side by sending an event.
		 */
		defineMethod(methodName, executor) {
			this.methods[methodName] = executor;
		}

		/**
		 * Calls a method registered on the other side, and returns the result.
		 *
		 * How this is accomplished:
		 * This switchboard sends a "get" message over the channel describing which method to call with which arguments.
		 * The other side's switchboard finds a method with that name, and calls it with the arguments.
		 * It then packages up the returned value into a "reply" message, sending it back to us across the channel.
		 * This switchboard has attached a listener on the channel, which will resolve with the result
		 * when a reply is detected.
		 *
		 * Instead of an arguments list, arguments are supplied as a map.
		 *
		 * @param method the name of the method to call
		 * @param args arguments that will be supplied. Must be serializable, no functions or other nonense.
		 * @returns whatever is returned from the method
		 */
		get(method, args) {
			return new Promise((resolve, reject) => {
				// In order to "call a method" on the other side of the port,
				// we will send a message with a unique id
				const messageId = this.getNewMessageId();
				// attach a new listener to our port, and remove it when we get a response
				const listener = event => {
					const message = event.data;
					if (message.messageId !== messageId) {
						return;
					}
					main_core.Event.unbind(this.port, 'message', listener);
					if (this.isReply(message)) {
						resolve(message.result);
					} else {
						const errStr = this.isError(message) ? message.error : 'Unexpected response message';
						reject(new Error(errStr));
					}
				};
				main_core.Event.bind(this.port, 'message', listener);
				this.port.start();
				const message = {
					switchboardAction: SwitchboardAction.GET,
					method,
					messageId,
					args
				};
				this.port.postMessage(message);
			});
		}

		/**
		 * Emit calls a method on the other side just like get does.
		 * But emit doesn't wait for a response, it just sends and forgets.
		 *
		 * @param method
		 * @param args
		 */
		emit(method, args) {
			const message = {
				switchboardAction: SwitchboardAction.EMIT,
				method,
				args
			};
			this.port.postMessage(message);
		}
		start() {
			this.port.start();
		}
		log(...args) {
			if (this.debugMode) {
				console.debug(`[${this.name}]`, ...args);
			}
		}
		logError(...args) {
			console.error(`[${this.name}]`, ...args);
		}
		getNewMessageId() {
			// eslint-disable-next-line no-plusplus
			return `m_${this.name}_${this.incrementor++}`;
		} // @ts-ignore

		isGet(message) {
			return message.switchboardAction === SwitchboardAction.GET;
		}
		isReply(message) {
			return message.switchboardAction === SwitchboardAction.REPLY;
		}
		isEmit(message) {
			return message.switchboardAction === SwitchboardAction.EMIT;
		}
		isError(message) {
			return message.switchboardAction === SwitchboardAction.ERROR;
		}
	}

	// Each message we send on the channel specifies an action we want the other side to cooperate with.
	// var Actions;

	// helper types/functions for making sure wires don't get crossed
	// (function(Actions) { Actions.GET = 'get'; Actions.REPLY = 'reply'; Actions.EMIT = 'emit'; Actions.ERROR = 'error'; })(Actions || (Actions = {}));

	// function isError(message)
	// {
	// 	return message.switchboardAction === Actions.ERROR;
	// }

	// (function() { var reactHotLoader = typeof reactHotLoaderGlobal === 'undefined' ? undefined : reactHotLoaderGlobal.default; if (!reactHotLoader)
	//
	//
	// //   { return;
	// // }reactHotLoader.register(Switchboard, 'Switchboard', '/Users/ville/src/expertbridge-release/expertbridge-frontend/packages/expertbridge-ui-switchboard/src/switchboard.ts'); reactHotLoader.register(isGet, 'isGet', '/Users/ville/src/expertbridge-release/expertbridge-frontend/packages/expertbridge-ui-switchboard/src/switchboard.ts'); reactHotLoader.register(isReply, 'isReply', '/Users/ville/src/expertbridge-release/expertbridge-frontend/packages/expertbridge-ui-switchboard/src/switchboard.ts'); reactHotLoader.register(isEmit, 'isEmit', '/Users/ville/src/expertbridge-release/expertbridge-frontend/packages/expertbridge-ui-switchboard/src/switchboard.ts'); reactHotLoader.register(isError, 'isError', '/Users/ville/src/expertbridge-release/expertbridge-frontend/packages/expertbridge-ui-switchboard/src/switchboard.ts'); })();
	//
	// (function() { var leaveModule = typeof reactHotLoaderGlobal === 'undefined' ? undefined : reactHotLoaderGlobal.leaveModule; leaveModule && leaveModule(module); })();

	class ApacheSupersetEmbeddedLoader {
		static IFRAME_COMMS_MESSAGE_TYPE = '__embedded_comms__';
		static DASHBOARD_UI_FILTER_CONFIG_URL_PARAM_KEY = {
			visible: 'show_filters',
			expanded: 'expand_filters',
			nativeFiltersKey: 'native_filters_key',
			preselectFilters: 'preselect_filters',
			nativeFilters: 'native_filters'
		};
		#options;
		#switchboard;
		#embedAlive;
		constructor(options) {
			this.#options = options;
			this.communicationsChannel = new MessageChannel();
			this.#switchboard = null;
			this.#embedAlive = false;
		}
		async embedDashboard() {
			const guestToken = this.#options.fetchGuestToken;
			this.log('embedding');
			const [result] = await Promise.all([this.mountIframe()]);
			this.#switchboard = result;
			this.#switchboard.emit('guestToken', {
				guestToken
			});
			this.log('sent guest token');
			if (this.#options.onTokenExpired) {
				this.#switchboard.defineMethod('refreshGuestToken', async () => {
					const newToken = await this.#options.onTokenExpired();
					return {
						guestToken: newToken
					};
				});
			}
			const getScrollSize = () => this.#switchboard.get('getScrollSize');
			const getDashboardPermalink = anchor => this.#switchboard.get('getDashboardPermalink', {
				anchor
			});
			const getActiveTabs = () => this.#switchboard.get('getActiveTabs');
			const getScreenshot = () => this.#switchboard.get('getScreenshot');
			const getPdf = () => this.#switchboard.get('getPdf');
			return {
				getScrollSize,
				getDashboardPermalink,
				getActiveTabs,
				getScreenshot,
				getPdf
			};
		}
		calculateConfig() {
			let configNumber = 0;
			const dashboardUiConfig = this.#options.dashboardUiConfig;
			if (!dashboardUiConfig) {
				return configNumber;
			}
			if (dashboardUiConfig.hideTitle) {
				configNumber += 1;
			}
			if (dashboardUiConfig.hideTab) {
				configNumber += 2;
			}
			if (dashboardUiConfig.hideChartControls) {
				configNumber += 8;
			}
			return configNumber;
		}
		async mountIframe() {
			return new Promise((resolve, reject) => {
				const iframe = main_core.Dom.create('iframe');
				const id = this.#options.id;
				const dashboardConfig = this.#options.dashboardUiConfig ? `?uiConfig=${this.calculateConfig()}` : '';
				const filterConfig = this.#options.dashboardUiConfig?.filters || {};
				const filterConfigKeys = Object.keys(filterConfig);
				let filterConfigUrlParams = '';
				if (filterConfigKeys.length > 0) {
					const stringParams = filterConfigKeys.map(key => `${ApacheSupersetEmbeddedLoader.DASHBOARD_UI_FILTER_CONFIG_URL_PARAM_KEY[key]}=${filterConfig[key]}`).join('&');
					filterConfigUrlParams += `&${stringParams}`;
				}
				const supersetDomain = this.#options.supersetDomain;
				const debug = this.#options.debug;
				const onAlive = event => {
					if (event.source === iframe.contentWindow && typeof event.data === 'object' && event.data.type === ApacheSupersetEmbeddedLoader.IFRAME_COMMS_MESSAGE_TYPE && event.data.handshake === 'alive') {
						this.#embedAlive = true;
						iframe.style.visibility = '';
						this.log('received alive signal from embed');
					}
				};
				main_core.Event.bind(window, 'message', onAlive);
				iframe.style.visibility = 'hidden';

				// set up the iframe's sandbox configuration
				iframe.sandbox.add('allow-same-origin'); // needed for postMessage to work
				iframe.sandbox.add('allow-scripts'); // obviously the iframe needs scripts
				iframe.sandbox.add('allow-presentation'); // for fullscreen charts
				iframe.sandbox.add('allow-downloads'); // for downloading charts as image
				iframe.sandbox.add('allow-forms'); // for forms to submit
				iframe.sandbox.add('allow-popups'); // for exporting charts as csv
				// add these if it turns out we need them:
				// iframe.sandbox.add("allow-top-navigation");

				main_core.Event.bind(iframe, 'load', () => {
					main_core.Event.unbind(window, 'message', onAlive);
					if (!this.#embedAlive) {
						this.log('embed did not send alive signal, rejecting');
						main_core.Dom.remove(iframe);
						reject(new Error('Embedded dashboard is not available'));
						return;
					}
					const commsChannel = this.communicationsChannel;
					const ourPort = commsChannel.port1;
					const theirPort = commsChannel.port2;

					// Send one of the message channel ports to the iframe to initialize embedded comms
					// See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
					// we know the content window isn't null because we are in the load event handler.

					iframe.contentWindow.postMessage({
						type: ApacheSupersetEmbeddedLoader.IFRAME_COMMS_MESSAGE_TYPE,
						handshake: 'port transfer'
					}, supersetDomain, [theirPort]);
					this.log('sent message channel to the iframe');
					// return our port from the promise

					resolve(new Switchboard({
						port: ourPort,
						name: 'superset-embedded-sdk',
						debug
					}));
				});
				iframe.src = main_core.Uri.addParam(`${supersetDomain}/embedded/${id}${dashboardConfig}${filterConfigUrlParams}`, this.#options.dashboardUiConfig?.urlParams ?? {});
				if (main_core.Type.isDomNode(this.#options.mountPoint)) {
					main_core.Dom.append(iframe, this.#options.mountPoint);
				}
				this.log('placed the iframe');
			});
		}

		// Reserved for the BitrixGPT integration (see #onGptButtonClick in
		// detail-instance.js). The legacy AI prototype consumed both helpers; the
		// next iteration will go through the MCP tool set — kept here as
		// scaffolding so the switchboard contract is documented next to the
		// other passthrough methods.
		/*
		getDataMask(): Promise
		{
			return this.#switchboard.get('getDataMask');
		}
			getAppliedFilters(): Promise
		{
			return this.#switchboard.get('getAppliedFilters');
		}
		*/

		// Need patched superset with getScreenshot and getPdf actions - superset-frontend/src/embedded/api.tsx:61
		getScreenshot() {
			return this.#switchboard.get('getScreenshot');
		}
		getPdf(dashboardTitle) {
			return this.#switchboard.get('getPdf', {
				dashboardTitle
			});
		}

		/**
		 * Sets locked external filter values for shared dashboards.
		 * These filters will be displayed as read-only with locked values.
		 *
		 * @param lockedFilters Format: {filterId: {value: [...], label: '...'}, ...}
		 * @returns Promise with result
		 */
		setLockedExternalFilters(lockedFilters) {
			if (!this.#switchboard) {
				return Promise.reject(new Error('Switchboard not initialized'));
			}
			return this.#switchboard.get('setLockedExternalFilters', {
				lockedFilters
			});
		}

		/**
		 * Gets current values of external filters (CompanyStructure, TasksFlow, BPWorkflowTemplate).
		 * Use this to capture filter state when sharing a dashboard.
		 *
		 * @returns Promise with external filter values: {filterId: {value: [...], label: '...', filterType: '...'}, ...}
		 */
		getExternalFilterValues() {
			if (!this.#switchboard) {
				return Promise.reject(new Error('Switchboard not initialized'));
			}
			return this.#switchboard.get('getExternalFilterValues');
		}
		log(...info) {
			if (this.isDebug()) {
				console.debug(`[superset-embedded-sdk][dashboard ${this.#options.id}]`, ...info);
			}
		}
		isDebug() {
			return this.#options.debug === true;
		}
	}

	exports.ApacheSupersetEmbeddedLoader = ApacheSupersetEmbeddedLoader;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX);
