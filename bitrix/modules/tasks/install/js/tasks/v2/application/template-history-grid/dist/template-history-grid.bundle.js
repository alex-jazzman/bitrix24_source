/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3,ui_vue3_mixins_locMixin,main_core_events,main_popup,ui_system_typography_vue,tasks_v2_lib_apiClient,tasks_v2_const,main_date,tasks_v2_lib_timezone,ui_iconSet_api_vue,tasks_v2_component_elements_hint,main_core) {
	'use strict';

	const typeLocalizationMap = {
	  1: 'TASKS_V2_TEMPLATE_HISTORY_GRID_TYPE_NOTICE',
	  2: 'TASKS_V2_TEMPLATE_HISTORY_GRID_TYPE_WARNING',
	  3: 'TASKS_V2_TEMPLATE_HISTORY_GRID_TYPE_ERROR'
	};

	// @vue/component
	const TypeFields = {
	  props: {
	    getGrid: {
	      type: Function,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      typeLocalizationMap
	    };
	  },
	  data() {
	    return {
	      systemLogTypeRef: [],
	      systemLogType: []
	    };
	  },
	  methods: {
	    async update() {
	      const type = this.getGrid().querySelectorAll('[data-system-log-type]');
	      this.systemLogType = [...type].map(systemLogTypeNode => this.getSystemLogType(systemLogTypeNode));
	      await this.$nextTick();
	      type.forEach(systemLogTypeNode => {
	        const systemLogType = this.getSystemLogType(systemLogTypeNode);
	        systemLogTypeNode.append(this.systemLogTypeRef[systemLogType.rowId]);
	      });
	    },
	    getSystemLogType(systemLogTypeNode) {
	      const rowId = Number(systemLogTypeNode.closest('[data-id]').dataset.id);
	      const type = systemLogTypeNode.dataset.systemLogType;
	      return {
	        rowId,
	        type
	      };
	    },
	    setRef(element, rowId) {
	      var _this$systemLogTypeRe;
	      (_this$systemLogTypeRe = this.systemLogTypeRef) != null ? _this$systemLogTypeRe : this.systemLogTypeRef = {};
	      this.systemLogTypeRef[rowId] = element;
	    }
	  },
	  template: `
		<template v-for="(type, id) in systemLogType" :key="id">
			<div :ref="(el) => setRef(el, type.rowId)">
				{{ loc(typeLocalizationMap[type.type] ?? Object.values(typeLocalizationMap)[0]) }}
			</div>
		</template>
	`
	};

	// @vue/component
	const TimeFields = {
	  props: {
	    getGrid: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    return {
	      systemLogTimeRef: [],
	      systemLogTime: []
	    };
	  },
	  methods: {
	    async update() {
	      const time = this.getGrid().querySelectorAll('[data-system-log-time]');
	      this.systemLogTime = [...time].map(systemLogTimeNode => this.getSystemLogTime(systemLogTimeNode));
	      await this.$nextTick();
	      time.forEach(systemLogTimeNode => {
	        const systemLogTime = this.getSystemLogTime(systemLogTimeNode);
	        systemLogTimeNode.append(this.systemLogTimeRef[systemLogTime.rowId]);
	      });
	    },
	    getSystemLogTime(systemLogTimeNode) {
	      const rowId = Number(systemLogTimeNode.closest('[data-id]').dataset.id);
	      const offsetTimestamp = this.getOffsetTimestamp(systemLogTimeNode.dataset.systemLogTime);
	      return {
	        rowId,
	        offsetTimestamp
	      };
	    },
	    getOffsetTimestamp(timestampString) {
	      const timestamp = Number(timestampString) * 1000;
	      const offset = tasks_v2_lib_timezone.timezone.getOffset(timestamp);
	      const offsetTimestamp = (timestamp + offset) / 1000;
	      return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), offsetTimestamp);
	    },
	    setRef(element, rowId) {
	      var _this$systemLogTimeRe;
	      (_this$systemLogTimeRe = this.systemLogTimeRef) != null ? _this$systemLogTimeRe : this.systemLogTimeRef = {};
	      this.systemLogTimeRef[rowId] = element;
	    }
	  },
	  template: `
		<template v-for="(time, id) in systemLogTime" :key="id">
			<div :ref="(el) => setRef(el, time.rowId)">{{ time.offsetTimestamp }}</div>
		</template>
	`
	};

	const pattern = /\(#(\d+)\)(?![\S\s]*\(#\d+\))/;

	// @vue/component
	const MessageField = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Hint: tasks_v2_component_elements_hint.Hint
	  },
	  props: {
	    /** @type Message */
	    message: {
	      type: Object,
	      required: true
	    },
	    activeHintRowId: {
	      type: Number,
	      default: null
	    }
	  },
	  emits: ['hintOpen', 'hintClose'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      showHint: false
	    };
	  },
	  computed: {
	    formattedMessage() {
	      var _this$message$message;
	      return (_this$message$message = this.message.message) == null ? void 0 : _this$message$message.replace(pattern, '').trim();
	    },
	    linkText() {
	      var _this$message$message2, _this$message$message3;
	      return (_this$message$message2 = (_this$message$message3 = this.message.message) == null ? void 0 : _this$message$message3.match(pattern)[0]) != null ? _this$message$message2 : null;
	    },
	    errorMessage() {
	      return this.message.errors[0].MESSAGE;
	    },
	    errorLink() {
	      return this.message.errors[0].LINK;
	    },
	    popupOptions() {
	      return {
	        offsetLeft: this.$refs.errorIcon.$el.offsetWidth / 2,
	        maxWidth: 494
	      };
	    }
	  },
	  methods: {
	    openHint() {
	      if (this.activeHintRowId !== null && this.activeHintRowId !== this.message.rowId) {
	        return;
	      }
	      if (!this.showHint) {
	        this.showHint = true;
	        this.$emit('hintOpen', this.message.rowId);
	      }
	    },
	    closeHint() {
	      if (this.showHint) {
	        this.showHint = false;
	        this.$emit('hintClose', this.message.rowId);
	      }
	    }
	  },
	  template: `
		<div class="tasks-field-replication-message">
			<div v-if="message.link">{{ formattedMessage }}<a :href="message.link">{{ linkText }}</a></div>
			<span v-else>{{ message.message }}</span>
				<BIcon
					v-if="message.errors?.length > 0"
					ref="errorIcon"
					class="tasks-field-replication-error-icon"
					@mouseenter="openHint"
					:name="Outline.ALERT"
				/>
				<Hint
					v-if="showHint"
					:bindElement="$refs.errorIcon.$el"
					:options="popupOptions"
					@close="closeHint"
				>
					<div class="tasks-field-replication-sheet__error-hint-container">
						<div class="tasks-field-replication-sheet__error-hint__error-message">
							{{ errorMessage.replace('#LINK#', '') }}
						</div>
						<div
							v-if="errorLink"
							class="tasks-field-replication-sheet__error-hint__error-link-container"
						>
							<a
								:href="errorLink"
								class="tasks-field-replication-sheet__error-hint__error-link"
							>
								{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_ACCESS_RIGHTS_MORE_LINK') }}
							</a>
						</div>
					</div>
				</Hint>
		</div>
	`
	};

	// @vue/component
	const MessageFields = {
	  components: {
	    MessageField
	  },
	  props: {
	    getGrid: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    return {
	      systemLogMessageRef: [],
	      systemLogMessage: [],
	      activeHintRowId: null
	    };
	  },
	  methods: {
	    async update() {
	      const message = this.getGrid().querySelectorAll('[data-system-log-message]');
	      this.systemLogMessage = [...message].map(systemLogMessageNode => this.getSystemLogMessage(systemLogMessageNode));
	      await this.$nextTick();
	      message.forEach(systemLogMessageNode => {
	        const systemLogMessage = this.getSystemLogMessage(systemLogMessageNode);
	        systemLogMessageNode.append(this.systemLogMessageRef[systemLogMessage.rowId]);
	      });
	    },
	    getSystemLogMessage(systemLogMessageNode) {
	      const rowId = Number(systemLogMessageNode.closest('[data-id]').dataset.id);

	      /** @type {{ message: ?string, link: ?string, errors: ?array }} */
	      const message = JSON.parse(systemLogMessageNode.dataset.systemLogMessage);
	      return {
	        rowId,
	        message: message.message,
	        link: message.link,
	        errors: message.errors
	      };
	    },
	    setRef(element, rowId) {
	      var _this$systemLogMessag;
	      (_this$systemLogMessag = this.systemLogMessageRef) != null ? _this$systemLogMessag : this.systemLogMessageRef = {};
	      this.systemLogMessageRef[rowId] = element;
	    },
	    onHintOpen(rowId) {
	      this.activeHintRowId = rowId;
	    },
	    onHintClose(rowId) {
	      if (this.activeHintRowId === rowId) {
	        this.activeHintRowId = null;
	      }
	    }
	  },
	  template: `
		<template v-for="(message, id) in systemLogMessage" :key="id">
			<MessageField
				:ref="(el) => setRef(el?.$el, message.rowId)"
				:message="message"
				:activeHintRowId
				@hintOpen="onHintOpen"
				@hintClose="onHintClose"
			/>
		</template>
	`
	};

	// @vue/component
	const ErrorsList = {
	  props: {
	    errors: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    parsedErrors() {
	      return JSON.parse(this.errors);
	    },
	    isEmpty() {
	      return main_core.Type.isNil(this.parsedErrors) || this.parsedErrors.length === 0;
	    }
	  },
	  template: `
		<ul v-if="!isEmpty">
			<li v-for="(error, errorIndex) in parsedErrors" :key="errorIndex">
				{{ (error.MESSAGE ?? '').replace('#LINK#', '') }}
				<a
					v-if="error.LINK"
					:href="error.LINK"
				>
					{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_ACCESS_RIGHTS_MORE_LINK') }}
				</a>
			</li>
		</ul>
		<span v-else>{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_NO_ERRORS_PLACEHOLDER') }}</span>
	`
	};

	// @vue/component
	const ErrorsFields = {
	  components: {
	    ErrorsList
	  },
	  props: {
	    getGrid: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    return {
	      systemLogErrorsRef: [],
	      systemLogErrors: []
	    };
	  },
	  methods: {
	    async update() {
	      const errors = this.getGrid().querySelectorAll('[data-system-log-errors]');
	      this.systemLogErrors = [...errors].map(systemLogErrorsNode => this.getSystemLogErrors(systemLogErrorsNode));
	      await this.$nextTick();
	      errors.forEach(systemLogErrorsNode => {
	        const systemLogErrors = this.getSystemLogErrors(systemLogErrorsNode);
	        systemLogErrorsNode.append(this.systemLogErrorsRef[systemLogErrors.rowId]);
	      });
	    },
	    getSystemLogErrors(systemLogErrorsNode) {
	      const rowId = Number(systemLogErrorsNode.closest('[data-id]').dataset.id);
	      const errors = systemLogErrorsNode.dataset.systemLogErrors;
	      return {
	        rowId,
	        errors
	      };
	    },
	    setRef(element, rowId) {
	      var _this$systemLogErrors;
	      (_this$systemLogErrors = this.systemLogErrorsRef) != null ? _this$systemLogErrors : this.systemLogErrorsRef = {};
	      this.systemLogErrorsRef[rowId] = element;
	    }
	  },
	  template: `
		<template v-for="(systemErrors, id) in systemLogErrors" :key="id">
			<ErrorsList
				:ref="(el) => setRef(el?.$el, systemErrors.rowId)"
				:errors="systemErrors.errors"
			/>
		</template>
	`
	};

	// @vue/component
	const GridLoader = {
	  template: `
		<div class="tasks-template-history-grid-loader-spinner"/>
	`
	};

	const gridId = 'tasks-template-history-grid';

	// @vue/component
	const App = {
	  name: 'TemplateHistoryGrid',
	  components: {
	    HeadlineXl: ui_system_typography_vue.HeadlineXl,
	    TimeFields,
	    TypeFields,
	    MessageFields,
	    ErrorsFields,
	    GridLoader
	  },
	  props: {
	    templateId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  mounted() {
	    main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
	    main_core_events.EventEmitter.subscribe('Grid::updated', this.update);
	    void this.getData();
	  },
	  beforeUnmount() {
	    var _BX$Main, _BX$Main$gridManager, _PopupManager$getPopu;
	    main_core_events.EventEmitter.unsubscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
	    main_core_events.EventEmitter.unsubscribe('Grid::updated', this.update);
	    (_BX$Main = BX.Main) == null ? void 0 : (_BX$Main$gridManager = _BX$Main.gridManager) == null ? void 0 : _BX$Main$gridManager.destroy(gridId);
	    (_PopupManager$getPopu = main_popup.PopupManager.getPopupById(`${gridId}-grid-settings-window`)) == null ? void 0 : _PopupManager$getPopu.destroy();
	  },
	  methods: {
	    async getData() {
	      const {
	        html
	      } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateHistoryGetGrid, {
	        templateId: this.templateId
	      });
	      await main_core.Runtime.html(this.$refs.grid, html);
	      this.update();
	    },
	    handleBeforeGridRequest(event) {
	      const [, eventArgs] = event.getData();
	      if (eventArgs.url) {
	        var _eventArgs$url;
	        this.nav = new main_core.Uri((_eventArgs$url = eventArgs.url) != null ? _eventArgs$url : '').getQueryParams().nav;
	      }
	      eventArgs.url = `/bitrix/services/main/ajax.php?action=tasks.V2.Template.History.getGridData&nav=${this.nav}`;
	      eventArgs.method = 'POST';
	      eventArgs.data = {
	        templateId: this.templateId
	      };
	    },
	    update() {
	      void this.$refs.timeFields.update();
	      void this.$refs.typeFields.update();
	      void this.$refs.messageFields.update();
	      void this.$refs.errorsFields.update();
	    }
	  },
	  template: `
		<div class="tasks-template-history-grid-container">
			<div class="tasks-template-history-grid-header">
				<HeadlineXl>{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_LOG_HEADER') }}</HeadlineXl>
			</div>
			<div ref="grid" class="tasks-template-history-grid-main-content"><GridLoader/></div>
			<TimeFields ref="timeFields" :getGrid="() => this.$refs.grid"/>
			<TypeFields ref="typeFields" :getGrid="() => this.$refs.grid"/>
			<MessageFields ref="messageFields" :getGrid="() => this.$refs.grid"/>
			<ErrorsFields ref="errorsFields" :getGrid="() => this.$refs.grid"/>
		</div>
	`
	};

	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _mountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountApplication");
	var _unmountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unmountApplication");
	class TemplateHistoryGrid {
	  constructor(params = {}) {
	    Object.defineProperty(this, _unmountApplication, {
	      value: _unmountApplication2
	    });
	    Object.defineProperty(this, _mountApplication, {
	      value: _mountApplication2
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  async mount(slider) {
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = await babelHelpers.classPrivateFieldLooseBase(this, _mountApplication)[_mountApplication](slider.getContentContainer());
	  }
	  unmount() {
	    babelHelpers.classPrivateFieldLooseBase(this, _unmountApplication)[_unmountApplication]();
	  }
	}
	async function _mountApplication2(container) {
	  const application = ui_vue3.BitrixVue.createApp(App, babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]);
	  application.mixin(ui_vue3_mixins_locMixin.locMixin);
	  application.mount(container);
	  return application;
	}
	function _unmountApplication2() {
	  var _babelHelpers$classPr;
	  (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _application)[_application]) == null ? void 0 : _babelHelpers$classPr.unmount();
	}

	exports.TemplateHistoryGrid = TemplateHistoryGrid;

}((this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}),BX.Vue3,BX.Vue3.Mixins,BX.Event,BX.Main,BX.UI.System.Typography.Vue,BX.Tasks.V2.Lib,BX.Tasks.V2.Const,BX.Main,BX.Tasks.V2.Lib,BX.UI.IconSet,BX.Tasks.V2.Component.Elements,BX));
//# sourceMappingURL=template-history-grid.bundle.js.map
