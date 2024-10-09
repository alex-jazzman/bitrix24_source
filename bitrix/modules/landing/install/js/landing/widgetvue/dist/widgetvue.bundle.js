/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core_events,main_loader,ui_vue3,landing_backend,main_core) {
	'use strict';

	async function fetchData(blockId, params = {}) {
	  let data = await landing_backend.Backend.getInstance().action('RepoWidget::fetchData', {
	    blockId,
	    params
	  }).catch(err => {
	    console.error("Fetch error", err);
	  });
	  try {
	    data = JSON.parse(data);
	    if (data['error']) {
	      console.error("Fetch data error: data failed", data['error']);
	      data = {};
	    }
	  } catch (e) {
	    console.error("Fetch data error: json parse error");
	    data = {};
	  }
	  return data;
	}

	const fetchAlarmTime = 5000;
	const Content = {
	  props: {
	    defaultData: {
	      type: Object,
	      default: null
	    },
	    blockId: {
	      type: Number,
	      required: true
	    },
	    appId: {
	      type: Number,
	      default: 0
	    },
	    fetchable: {
	      type: Boolean,
	      default: false
	    },
	    clickable: {
	      type: Boolean,
	      default: false
	    }
	  },
	  data() {
	    return {
	      isFetching: false
	    };
	  },
	  methods: {
	    fetch(params = {}) {
	      if (!this.clickable || this.isFetching) {
	        console.warn('Events is disabled now');
	        return;
	      }
	      if (this.appId <= 0 || !this.fetchable) {
	        console.warn('If you want fetch external data in widget - you must add application and handler');
	        return;
	      }
	      this.isFetching = true;
	      this.$bitrix.eventEmitter.emit('landing:widgetvue:startContentLoad');
	      const timeout = setTimeout(() => {
	        this.$bitrix.eventEmitter.emit('landing:widgetvue:onMessage', {
	          message: main_core.Loc.getMessage('LANDING_WIDGETVUE_LOADER_TOO_LONG')
	        });
	        this.$bitrix.eventEmitter.emit('landing:widgetvue:endContentLoad');
	      }, fetchAlarmTime);
	      fetchData(this.blockId, params).then(data => {
	        clearTimeout(timeout);
	        this.$bitrix.eventEmitter.emit('landing:widgetvue:endContentLoad');
	        this.$bitrix.eventEmitter.emit('landing:widgetvue:onHideMessage');
	        this.isFetching = false;
	        if (data && Object.keys(data).length > 0) {
	          for (let code in data) {
	            if (this[code] !== undefined) {
	              this[code] = data[code];
	            }
	          }
	        }
	      });
	    },
	    openApplication(params = {}) {
	      if (!this.clickable || this.isFetching) {
	        console.info('Events is disabled now');
	        return;
	      }
	      if (this.appId <= 0) {
	        console.warn('If you want fetch external data in widget - you must add application and handler');
	        return;
	      }
	      BX.rest.AppLayout.openApplication(this.appId, params);
	    },
	    openPath(path) {
	      if (!this.clickable || this.isFetching) {
	        console.info('Events is disabled now');
	        return;
	      }
	      const url = new URL(path, window.location.origin);
	      if (url.origin === window.location.origin) {
	        window.open(url.href, '_blank');
	      }
	    }
	  },
	  async setup(props) {
	    if (props.appId <= 0 || !props.fetchable) {
	      console.info('If you want fetch external data in widget - you must add application and handler');
	      return;
	    }
	    const dataRefs = {};
	    if (props.defaultData !== null && Object.keys(props.defaultData).length > 0) {
	      for (let code in props.defaultData) {
	        dataRefs[code] = ui_vue3.ref(props.defaultData[code]);
	      }
	      fetchData(props.blockId).then(data => {
	        if (data && main_core.Type.isObject(data)) {
	          for (let code in data) {
	            if (dataRefs[code]) {
	              dataRefs[code].value = data[code];
	            }
	          }
	        }
	      });
	    } else {
	      const data = await fetchData(props.blockId);
	      for (let code in data) {
	        dataRefs[code] = ui_vue3.ref(data[code]);
	      }
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
				<a class="w-loader-link" :href="link">linkText: link</a>	
			</div>
		</div>
	`
	};

	var _rootNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rootNode");
	var _data = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("data");
	var _blockId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("blockId");
	var _appId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("appId");
	var _fetchable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fetchable");
	var _clickable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clickable");
	var _allowedByTariff = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("allowedByTariff");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _contentTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("contentTemplate");
	var _createApp = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createApp");
	class WidgetVue {
	  constructor(options) {
	    Object.defineProperty(this, _createApp, {
	      value: _createApp2
	    });
	    Object.defineProperty(this, _rootNode, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _data, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _blockId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _appId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _fetchable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _clickable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _allowedByTariff, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _contentTemplate, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode] = main_core.Type.isString(options.rootNode) ? document.querySelector(options.rootNode) : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data] = main_core.Type.isObject(options.data) ? options.data : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _blockId)[_blockId] = options.blockId ? main_core.Text.toNumber(options.blockId) : 0;
	    babelHelpers.classPrivateFieldLooseBase(this, _appId)[_appId] = options.appId ? main_core.Text.toNumber(options.appId) : 0;
	    babelHelpers.classPrivateFieldLooseBase(this, _contentTemplate)[_contentTemplate] = main_core.Runtime.clone(Content);
	    babelHelpers.classPrivateFieldLooseBase(this, _fetchable)[_fetchable] = options.fetchable || false;
	    const isEditMode = main_core.Type.isFunction(BX.Landing.getMode) && BX.Landing.getMode() === 'edit';
	    babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable] = !isEditMode;
	    babelHelpers.classPrivateFieldLooseBase(this, _allowedByTariff)[_allowedByTariff] = babelHelpers.classPrivateFieldLooseBase(this, _appId)[_appId] && main_core.Type.isBoolean(options.allowedByTariff) ? options.allowedByTariff : true;
	  }
	  mount() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _blockId)[_blockId] > 0 && babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode] && !WidgetVue.runningAppNodes.has(babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode])) {
	      this.loader = new main_loader.Loader({
	        target: babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode]
	      });
	      // todo: need<template> ?
	      babelHelpers.classPrivateFieldLooseBase(this, _contentTemplate)[_contentTemplate].template = babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode].innerHTML || '';
	      babelHelpers.classPrivateFieldLooseBase(this, _createApp)[_createApp]();
	      WidgetVue.runningAppNodes.add(babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode]);
	    }
	  }
	  showLoader() {
	    this.loader.show();
	  }
	  hideLoader() {
	    this.loader.hide();
	  }
	}
	function _createApp2() {
	  const context = this;
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = ui_vue3.BitrixVue.createApp({
	    name: 'BX widget ' + babelHelpers.classPrivateFieldLooseBase(this, _blockId)[_blockId],
	    components: {
	      Message,
	      Error,
	      Content: babelHelpers.classPrivateFieldLooseBase(this, _contentTemplate)[_contentTemplate]
	    },
	    props: {
	      defaultData: {
	        type: Object,
	        default: null
	      },
	      allowedByTariff: {
	        type: Boolean,
	        default: true
	      }
	    },
	    data() {
	      return {
	        message: null,
	        error: null
	      };
	    },
	    created() {
	      this.$bitrix.eventEmitter.subscribe('landing:widgetvue:startContentLoad', this.onShowLoader);
	      this.$bitrix.eventEmitter.subscribe('landing:widgetvue:endContentLoad', this.onHideLoader);
	      this.$bitrix.eventEmitter.subscribe('landing:widgetvue:onMessage', this.onShowMessage);
	      this.$bitrix.eventEmitter.subscribe('landing:widgetvue:onHideMessage', this.onHideMessage);
	      this.$bitrix.eventEmitter.subscribe('landing:widgetvue:onError', this.onShowError);
	    },
	    beforeUnmount() {
	      this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:startContentLoad', this.onShowLoader);
	      this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:endContentLoad', this.onHideLoader);
	      this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:onMessage', this.onShowMessage);
	      this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:onHideMessage', this.onHideMessage);
	      this.$bitrix.eventEmitter.unsubscribe('landing:widgetvue:onError', this.onShowError);
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
	        var _event$getData;
	        const message = ((_event$getData = event.getData()) == null ? void 0 : _event$getData.message) || null;
	        this.message = {
	          message: message
	        };
	      },
	      onHideMessage() {
	        this.message = null;
	      },
	      onShowError(event) {
	        var _event$getData2;
	        const message = ((_event$getData2 = event.getData()) == null ? void 0 : _event$getData2.message) || null;
	        this.error = {
	          message: message
	        };
	      }
	    },
	    beforeCreate() {
	      this.$bitrix.Application.set(context);
	    },
	    template: `
				<Error
					v-if="!allowedByTariff"
					message="${main_core.Loc.getMessage('LANDING_WIDGETVUE_ERROR_PAYMENT')}"
				>
				</Error>

				<Suspense v-else>
					<template #default>
						<div>
							<Error
								v-show="error !== null"
								v-bind="error && error.message !== null ? { 
									message: error.message 
								} : {}"
							/>
							<Message
								v-show="message !== null"
								v-bind="message && message.message !== null ? { 
									message: message.message 
								} : {}"
							/>
							<Content
								v-show="message === null && error === null"

								:defaultData="defaultData"
								:blockId=${babelHelpers.classPrivateFieldLooseBase(this, _blockId)[_blockId]}
								:appId="${babelHelpers.classPrivateFieldLooseBase(this, _appId)[_appId]}"
								:fetchable=${babelHelpers.classPrivateFieldLooseBase(this, _fetchable)[_fetchable]}
								:clickable=${babelHelpers.classPrivateFieldLooseBase(this, _clickable)[_clickable]}
							/>
						</div>
					</template>

					<template #fallback>
						<Message
							message="${main_core.Loc.getMessage('LANDING_WIDGETVUE_LOADER_DEFAULT_MESSAGE')}"
						/>
					</template>
				</Suspense>
			`
	  }, {
	    defaultData: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data],
	    allowedByTariff: babelHelpers.classPrivateFieldLooseBase(this, _allowedByTariff)[_allowedByTariff]
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode]);
	}
	WidgetVue.runningAppNodes = new Set();

	exports.WidgetVue = WidgetVue;

}((this.BX.Landing = this.BX.Landing || {}),BX.Event,BX,BX.Vue3,BX.Landing,BX));
//# sourceMappingURL=widgetvue.bundle.js.map
