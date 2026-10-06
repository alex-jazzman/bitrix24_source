/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, ui_vue3, main_core, main_core_events, main_loader) {
	'use strict';

	const fetchAlarmTime = 5000;
	const Content = {
		props: {
			defaultData: {
				type: Object,
				default: null
			},
			clickable: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isFetching: false,
				timeout: null
			};
		},
		created() {
			main_core_events.EventEmitter.subscribe('landing:widgetvue:engine:onSetData', this.onSetData);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('landing:widgetvue:engine:onSetData', this.onSetData);
		},
		methods: {
			onSetData(event) {
				clearTimeout(this.timeout);
				this.$bitrix.eventEmitter.emit('landing:widgetvue:engine:endContentLoad');
				this.$bitrix.eventEmitter.emit('landing:widgetvue:engine:onHideMessage');
				this.isFetching = false;
				if (main_core.Type.isObject(event.getData().data)) {
					const data = event.getData().data;
					Object.keys(data).forEach(code => {
						if (this[code] !== undefined) {
							this[code] = data[code];
						}
						// todo: and crete refs if not exists?
					});
				}
			},
			fetch(params = {}) {
				if (!this.clickable || this.isFetching) {
					console.info('Events is disabled now');
					return;
				}
				this.isFetching = true;
				this.$bitrix.eventEmitter.emit('landing:widgetvue:engine:startContentLoad');
				this.timeout = setTimeout(() => {
					this.$bitrix.eventEmitter.emit('landing:widgetvue:engine:onMessage', {
						message: main_core.Loc.getMessage('LANDING_WIDGETVUE_LOADER_TOO_LONG')
					});
					this.$bitrix.eventEmitter.emit('landing:widgetvue:engine:endContentLoad');
				}, fetchAlarmTime);
				this.$bitrix.Application.get().fetch(params);
			},
			openApplication(params = {}) {
				if (!this.clickable) {
					console.info('Events is disabled now');
					return;
				}
				this.$bitrix.Application.get().openApplication(params);
			},
			openPath(path) {
				if (!this.clickable) {
					console.info('Events is disabled now');
					return;
				}
				this.$bitrix.Application.get().openPath(path);
			}
		},
		setup(props) {
			// todo: to docs. All refs must be implicated in default? or we can create, but v-for can be broken

			// todo: or create refs via data? or pass when create
			const dataRefs = {};
			if (main_core.Type.isObject(props.defaultData)) {
				Object.keys(props.defaultData).forEach(code => {
					dataRefs[code] = ui_vue3.ref(props.defaultData[code]);
				});
			}
			return dataRefs;
		}
	};

	const Message = {
		props: {
			message: {
				type: String,
				default: main_core.Loc.getMessage('LANDING_WIDGETVUE_LOADER_DEFAULT_MESSAGE')
			},
			link: {
				type: String,
				default: null
			},
			linkText: {
				type: String,
				default: main_core.Loc.getMessage('LANDING_WIDGETVUE_ERROR_DEFAULT_LINK_TEXT')
			}
		},
		template: `
		<div class="w-loader">
			<div class="w-loader-icon"></div>
			<div class="w-loader-text">
				<div>{{message}}</div>
			</div>
		</div>
	`
	};

	const Error = {
		props: {
			message: {
				type: String,
				default: main_core.Loc.getMessage('LANDING_WIDGETVUE_ERROR_DEFAULT_MESSAGE')
			},
			link: {
				type: String,
				default: null
			},
			linkText: {
				type: String,
				default: main_core.Loc.getMessage('LANDING_WIDGETVUE_ERROR_DEFAULT_LINK_TEXT')
			}
		},
		template: `
		<div class="w-error">
			<div class="w-loader-icon --error"></div>
			<div class="w-error-text">
				<div>{{message}}</div>
				<a
					v-show="link !== null"
					class="w-loader-link" :href="link"
				>
							{{linkText}}
				</a>	
			</div>
		</div>
	`
	};

	class Engine {
		#parentOrigin = '';
		#id = '';
		#rootNode;
		#data;
		#error;
		#clickable = false;
		#application;
		#contentComponent;
		constructor(options) {
			this.#id = main_core.Type.isString(options.id) ? options.id : '';
			this.#rootNode = document.querySelector(`#${this.#id}`);
			this.#parentOrigin = main_core.Type.isString(options.origin) ? options.origin : null;
			this.#data = main_core.Type.isObject(options.data) ? options.data : null;
			this.#error = main_core.Type.isString(options.error) ? options.error : null;
			this.#clickable = main_core.Type.isBoolean(options.clickable) ? options.clickable : false;
			this.#contentComponent = main_core.Runtime.clone(Content);
		}
		render() {
			if (this.#rootNode) {
				this.loader = new main_loader.Loader({
					target: this.#rootNode
				});
				this.#contentComponent.template = this.#rootNode.innerHTML || '';
				this.#contentComponent.template = `<div>${this.#contentComponent.template}</div>`;
				this.#bindEvents();
				this.#createApp();
			}
		}
		showLoader() {
			this.loader.show();
		}
		hideLoader() {
			this.loader.hide();
		}
		fetch(params = {}) {
			if (params instanceof Event) {
				params = {};
			}
			this.#message('fetchData', params);
		}
		openApplication(params = {}) {
			this.#message('openApplication', params);
		}
		openPath(path) {
			this.#message('openPath', {
				path
			});
		}
		#message(name, params = {}) {
			window.parent.postMessage({
				name,
				params,
				origin: this.#id
			}, this.#parentOrigin);
		}
		#bindEvents() {
			main_core.Event.bind(window, 'message', this.#onMessage.bind(this));
		}
		#onMessage(event) {
			if (event.data && event.data.origin && event.data.name && event.data.params && main_core.Type.isObject(event.data.params)) {
				if (event.data.origin !== this.#id) {
					return;
				}
				if (event.data.name === 'setData' && main_core.Type.isObject(event.data.params.data)) {
					main_core_events.EventEmitter.emit('landing:widgetvue:engine:onSetData', {
						data: event.data.params.data
					});
				}
				if (event.data.name === 'setError' && main_core.Type.isObject(event.data.params.error) && main_core.Type.isString(event.data.params.error.message)) {
					main_core_events.EventEmitter.emit('landing:widgetvue:engine:onError', {
						message: event.data.params.error.message
					});
				}
				if (event.data.name === 'getSize') ;
				this.#refreshFrameSize();
			}
		}
		#refreshFrameSize() {
			requestAnimationFrame(() => {
				this.#message('setSize', {
					size: this.#rootNode.offsetHeight
				});
			});
		}
		#createApp() {
			const context = this;
			const defaultError = this.#error ? {
				message: this.#error
			} : null;
			this.#application = ui_vue3.BitrixVue.createApp({
				name: this.#id,
				components: {
					Message,
					Error,
					Content: this.#contentComponent
				},
				props: {
					defaultData: {
						type: Object,
						default: null
					}
				},
				data() {
					return {
						message: null,
						error: defaultError
					};
				},
				created() {
					this.$bitrix.eventEmitter.subscribe('landing:widgetvue:engine:startContentLoad', this.onShowLoader);
					this.$bitrix.eventEmitter.subscribe('landing:widgetvue:engine:endContentLoad', this.onHideLoader);
					this.$bitrix.eventEmitter.subscribe('landing:widgetvue:engine:onMessage', this.onShowMessage);
					this.$bitrix.eventEmitter.subscribe('landing:widgetvue:engine:onHideMessage', this.onHideMessage);
					main_core_events.EventEmitter.subscribe('landing:widgetvue:engine:onError', this.onShowError);
				},
				mounted() {
					this.$bitrix.Application.get().#refreshFrameSize();
					this.$nextTick(() => {
						const links = this.$el.getElementsByTagName('a');
						if (links.length > 0) {
							[].slice.call(links).map(link => {
								main_core.Event.bind(link, 'click', event => {
									event.preventDefault();
									event.stopPropagation();
								});
							});
						}
					});
				},
				beforeUnmount() {
					this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:engine:startContentLoad', this.onShowLoader);
					this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:engine:endContentLoad', this.onHideLoader);
					this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:engine:onMessage', this.onShowMessage);
					this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:engine:onHideMessage', this.onHideMessage);
					main_core_events.EventEmitter.unsubscribe('landing:widgetvue:engine:onError', this.onShowError);
				},
				methods: {
					onShowLoader() {
						// todo: move loader to comp
						this.$bitrix.Application.get().showLoader();
					},
					onHideLoader() {
						// todo: move loader to comp
						this.$bitrix.Application.get().hideLoader();
					},
					onShowMessage(event) {
						const message = event.getData()?.message || null;
						this.message = message ? {
							message
						} : null;
					},
					onHideMessage() {
						this.message = null;
					},
					onShowError(event) {
						// todo: set error link?
						const message = event.getData()?.message || null;
						this.error = message ? {
							message
						} : null;
						this.onHideLoader();
					}
				},
				beforeCreate() {
					this.$bitrix.Application.set(context);
				},
				template: `
				<div class="widget">
					<Error
						v-show="error !== null"
						v-bind="error && error.message !== null ? error : {}"
					/>
					<Message
						v-show="message !== null"
						v-bind="message && message.message !== null ? message : {}"
					/>
					<Content
						v-show="message === null && error === null"
						
						:defaultData="defaultData"
						:clickable=${this.#clickable}
					/>
				</div>
			`
			}, {
				defaultData: this.#data
			});
			this.#application.mount(this.#rootNode);
		}
	}

	exports.Engine = Engine;

})(this.BX.Landing.WidgetVue = this.BX.Landing.WidgetVue || {}, BX.Vue3, BX, BX.Event, BX);
//# sourceMappingURL=engine.bundle.js.map
