/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports,ui_vue3,crm_timeline_tools,main_date,ui_notification,main_core,ui_textEditor,crm_vue3_dialog) {
	'use strict';

	const TextEditorWrapperComponent = {
	  components: {
	    TextEditorComponent: ui_textEditor.TextEditorComponent
	  },
	  emits: ['change'],
	  props: {
	    textEditor: ui_textEditor.TextEditor
	  },
	  data() {
	    return {
	      textEditorEvents: {
	        onChange: this.emitChangeData
	      }
	    };
	  },
	  methods: {
	    emitChangeData() {
	      if (!main_core.Type.isFunction(this.onChangeDebounce)) {
	        this.onChangeDebounce = main_core.Runtime.debounce(this.onChange, 100, this);
	      }
	      this.onChangeDebounce();
	    },
	    onChange() {
	      this.$emit('change', {
	        prompt: this.textEditor.getText()
	      });
	    }
	  },
	  // language=Vue
	  template: `
		<TextEditorComponent
			:events="textEditorEvents"
			:editor-instance="textEditor"
		/>
	`
	};

	const ClientSelector = {
	  components: {
	    Dialog: crm_vue3_dialog.Dialog
	  },
	  props: {
	    currentEntityId: {
	      type: Number
	    },
	    currentEntityTypeId: {
	      type: Number
	    },
	    entityTypes: {
	      type: Array,
	      required: true
	    }
	  },
	  created() {
	    this.entities = [];
	    const entityTypeMap = {
	      contact: BX.CrmEntityType.names.contact,
	      company: BX.CrmEntityType.names.company,
	      deal: BX.CrmEntityType.names.deal
	    };
	    const commonOptions = {
	      dynamicLoad: true,
	      dynamicSearch: true,
	      options: {
	        showTab: true,
	        showPhones: true,
	        showMails: true,
	        hideReadMoreLink: false
	      }
	    };
	    this.entities = Object.entries(entityTypeMap).filter(([entityId, entityName]) => this.entityTypes.includes(entityName.toLowerCase())).map(([entityId]) => ({
	      id: entityId,
	      ...commonOptions
	    }));
	  },
	  computed: {
	    preselectedItems() {
	      if (this.currentEntityTypeId === null) {
	        return [];
	      }
	      return [[BX.CrmEntityType.resolveName(this.currentEntityTypeId).toLowerCase(), this.currentEntityId]];
	    }
	  },
	  // language=Vue
	  template: `
		<Dialog 
			:entities="entities"
			:show-avatars="true"
			:preselected-items="preselectedItems"
		/>
	`
	};

	const SegmentSelector = {
	  components: {
	    Dialog: crm_vue3_dialog.Dialog
	  },
	  props: {
	    segments: {
	      type: Array,
	      required: true
	    },
	    currentSegmentId: {
	      type: Number,
	      required: true
	    }
	  },
	  created() {
	    this.tabs = [{
	      id: 'segments',
	      title: ''
	    }];
	  },
	  computed: {
	    items() {
	      const currentId = String(this.currentSegmentId);
	      return this.segments.map(segment => ({
	        id: segment.id,
	        title: segment.title,
	        entityId: 'segment',
	        tabs: 'segments',
	        selected: String(segment.id) === currentId
	      }));
	    }
	  },
	  // language=Vue
	  template: `
		<Dialog
			:items="items"
			:tabs="tabs"
		/>
	`
	};

	const Sandbox = {
	  components: {
	    ClientSelector,
	    SegmentSelector,
	    TextEditorWrapperComponent
	  },
	  props: {
	    segments: {
	      type: Array,
	      required: true
	    },
	    onItemSentToAi: {
	      type: Function,
	      default: () => {}
	    },
	    textEditor: ui_textEditor.TextEditor
	  },
	  data() {
	    var _this$segments$0$titl, _this$segments$;
	    return {
	      currentEntityTypeId: BX.CrmEntityType.enumeration.deal,
	      currentEntityId: null,
	      currentClientId: null,
	      currentClientTypeId: null,
	      currentSegmentId: main_core.Type.isArrayFilled(this.segments) ? this.segments[0].id : 0,
	      currentSegmentTitle: (_this$segments$0$titl = (_this$segments$ = this.segments[0]) == null ? void 0 : _this$segments$.title) != null ? _this$segments$0$titl : '',
	      markers: [],
	      date: new Date(),
	      fromPeriodDate: new Date(),
	      toPeriodDate: new Date(),
	      isSuitableItem: null,
	      suitableItems: []
	    };
	  },
	  created() {
	    this.clientEntityTypes = ['contact', 'company'];
	    this.dealEntityTypes = ['deal'];
	  },
	  methods: {
	    onSelectClient(data) {
	      this.currentClientTypeId = BX.CrmEntityType.resolveId(data.entityId);
	      this.currentClientId = data.id;
	      this.isSuitableItem = null;
	    },
	    onSelectDeal(data) {
	      this.currentEntityId = data.id;
	      this.isSuitableItem = null;
	    },
	    onSelectSegment(data) {
	      this.currentSegmentId = data.id;
	      this.isSuitableItem = null;
	      this.suitableItems = [];
	    },
	    getSegmentById(segmentId) {
	      var _this$segments$find;
	      return (_this$segments$find = this.segments.find(segment => segment.id === segmentId)) != null ? _this$segments$find : null;
	    },
	    checkItem() {
	      const dataParams = {
	        entityId: this.currentEntityId,
	        entityTypeId: BX.CrmEntityType.enumeration.deal,
	        segmentId: this.currentSegmentId,
	        clientId: this.currentClientId,
	        clientTypeId: this.currentClientTypeId,
	        date: this.getDateTimestamp()
	      };
	      main_core.ajax.runAction('crm.repeatsale.sandbox.checkItem', {
	        data: dataParams
	      }).then(({
	        data
	      }) => {
	        this.isSuitableItem = data.isSuitableItem;
	      }, response => {
	        this.showError(response.errors[0].message);
	      }).catch(response => {
	        this.showError(response.errors[0].message);
	        throw response;
	      });
	    },
	    checkPeriod() {
	      const dataParams = {
	        segmentId: this.currentSegmentId,
	        fromDate: this.getFromPeriodDateTimestamp(),
	        toDate: this.getToPeriodDateTimestamp()
	      };
	      main_core.ajax.runAction('crm.repeatsale.sandbox.checkPeriod', {
	        data: dataParams
	      }).then(({
	        data
	      }) => {
	        const {
	          items
	        } = data;
	        this.suitableItems = items != null ? items : [];
	      }, response => {
	        this.showError(response.errors[0].message);
	      }).catch(response => {
	        this.showError(response.errors[0].message);
	        throw response;
	      });
	    },
	    fetchMarkers() {
	      const dataParams = {
	        entityId: this.currentEntityId,
	        entityTypeId: BX.CrmEntityType.enumeration.deal,
	        segmentId: this.currentSegmentId,
	        clientId: this.currentClientId,
	        clientTypeId: this.currentClientTypeId
	      };
	      if (!this.validateFetchMarkersParams(dataParams)) {
	        this.showError(this.fetchMarkersValidationErrorTitle);
	        return;
	      }
	      main_core.ajax.runAction('crm.repeatsale.sandbox.getMarkers', {
	        data: dataParams
	      }).then(({
	        data
	      }) => {
	        this.markers = data;
	      }, response => {
	        this.showError(response.errors[0].message);
	      }).catch(response => {
	        this.showError(response.errors[0].message);
	        throw response;
	      });
	    },
	    validateFetchMarkersParams(params) {
	      let isSuccess = true;
	      Object.keys(params).forEach(key => {
	        if (params[key] <= 0) {
	          isSuccess = false;
	        }
	      });
	      return isSuccess;
	    },
	    hideMarkers() {
	      this.markers = null;
	    },
	    hideSuitableItems() {
	      this.suitableItems = [];
	    },
	    showDatePicker() {
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	      BX.calendar({
	        node: this.$refs.datePicker,
	        bTime: false,
	        bHideTime: true,
	        bSetFocus: false,
	        value: main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), this.getDateTimestamp()),
	        callback: this.onSetDateByCalendar.bind(this)
	      });
	    },
	    showFromPeriodDatePicker() {
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	      BX.calendar({
	        node: this.$refs.fromPeriodDatePicker,
	        bTime: false,
	        bHideTime: true,
	        bSetFocus: false,
	        value: main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), this.getDateTimestamp()),
	        callback: this.onSetFromPeriodDateByCalendar.bind(this)
	      });
	    },
	    showToPeriodDatePicker() {
	      // eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
	      BX.calendar({
	        node: this.$refs.toPeriodDatePicker,
	        bTime: false,
	        bHideTime: true,
	        bSetFocus: false,
	        value: main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), this.getDateTimestamp()),
	        callback: this.onSetToPeriodDateByCalendar.bind(this)
	      });
	    },
	    onSetDateByCalendar(date) {
	      date.setHours(0, 0, 0);
	      this.date = date;
	    },
	    onSetFromPeriodDateByCalendar(date) {
	      date.setHours(0, 0, 0);
	      this.fromPeriodDate = date;
	    },
	    onSetToPeriodDateByCalendar(date) {
	      date.setHours(0, 0, 0);
	      this.toPeriodDate = date;
	    },
	    getDateTimestamp() {
	      var _this$date$getTime, _this$date;
	      return ((_this$date$getTime = (_this$date = this.date) == null ? void 0 : _this$date.getTime()) != null ? _this$date$getTime : 0) / 1000;
	    },
	    getFromPeriodDateTimestamp() {
	      var _this$fromPeriodDate$, _this$fromPeriodDate;
	      return ((_this$fromPeriodDate$ = (_this$fromPeriodDate = this.fromPeriodDate) == null ? void 0 : _this$fromPeriodDate.getTime()) != null ? _this$fromPeriodDate$ : 0) / 1000;
	    },
	    getToPeriodDateTimestamp() {
	      var _this$toPeriodDate$ge, _this$toPeriodDate;
	      return ((_this$toPeriodDate$ge = (_this$toPeriodDate = this.toPeriodDate) == null ? void 0 : _this$toPeriodDate.getTime()) != null ? _this$toPeriodDate$ge : 0) / 1000;
	    },
	    sendToAi() {
	      const dataParams = {
	        entityId: this.currentEntityId,
	        entityTypeId: BX.CrmEntityType.enumeration.deal,
	        segmentId: this.currentSegmentId,
	        clientId: this.currentClientId,
	        clientTypeId: this.currentClientTypeId
	      };
	      main_core.ajax.runAction('crm.repeatsale.sandbox.sendToAi', {
	        data: dataParams
	      }).then(({
	        data
	      }) => {
	        if (main_core.Type.isArrayFilled(data.errors)) {
	          this.showError(data.errors[0].message);
	          return;
	        }
	        this.isItemChecked = true;
	        this.onItemSentToAi(data);
	      }, () => {
	        this.showError();
	      }).catch(response => {
	        this.showError(response.errors[0].message);
	        throw response;
	      });
	    },
	    showError(message = null) {
	      if (message === null) {
	        const messageCode = 'CRM_REPEAT_SALE_SANDBOX_ERROR';
	        // eslint-disable-next-line no-param-reassign
	        message = this.$Bitrix.Loc.getMessage(messageCode);
	      }
	      ui_notification.UI.Notification.Center.notify({
	        content: main_core.Text.encode(message),
	        autoHideDelay: 6000
	      });
	    },
	    getItemUrl(entityTypeId, entityId) {
	      return BX.Crm.Router.Instance.getItemDetailUrl(entityTypeId, entityId);
	    }
	  },
	  computed: {
	    segmentSelectorTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_SEGMENT_LABEL');
	    },
	    clientSelectorTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_CLIENT_LABEL');
	    },
	    dealSelectorTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DEAL_LABEL');
	    },
	    dateTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE');
	    },
	    datePeriodTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE_PERIOD');
	    },
	    datePeriodFromTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE_PERIOD_FROM');
	    },
	    datePeriodToTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_DATE_PERIOD_TO');
	    },
	    promptTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PROMPT_LABEL');
	    },
	    aiAnswerTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_AI_ANSWER_LABEL');
	    },
	    submitTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_GET_MARKERS');
	    },
	    isSuitableItemCheckTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_IS_SUITABLE_ITEM_CHECK');
	    },
	    isSuitableItemTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_IS_SUITABLE_ITEM', {
	        '#SEGMENT_NAME#': this.currentSegmentTitle
	      });
	    },
	    isNotSuitableItemTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_IS_NOT_SUITABLE_ITEM', {
	        '#SEGMENT_NAME#': this.currentSegmentTitle
	      });
	    },
	    periodCheckTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PERIOD_CHECK');
	    },
	    periodCheckInfoTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PERIOD_CHECK_INFO');
	    },
	    sendToAiTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_AI_SEND');
	    },
	    fetchMarkersValidationErrorTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_GET_MARKERS_VALIDATE_ERROR');
	    },
	    hideTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_HIDE');
	    },
	    hasFilledMarkers() {
	      return main_core.Type.isPlainObject(this.markers) && Object.keys(this.markers).length > 0;
	    },
	    hasSuitableItems() {
	      return main_core.Type.isArrayFilled(this.suitableItems);
	    },
	    formattedDate() {
	      return main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), this.getDateTimestamp());
	    },
	    fromPeriodFormattedDate() {
	      return main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), this.getFromPeriodDateTimestamp());
	    },
	    toPeriodFormattedDate() {
	      return main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), this.getToPeriodDateTimestamp());
	    }
	  },
	  watch: {
	    currentSegmentId(segmentId) {
	      var _segment$prompt, _segment$title;
	      const segment = this.getSegmentById(segmentId);
	      this.textEditor.setText((_segment$prompt = segment == null ? void 0 : segment.prompt) != null ? _segment$prompt : '');
	      this.currentSegmentTitle = (_segment$title = segment == null ? void 0 : segment.title) != null ? _segment$title : '';
	    }
	  },
	  // language=Vue
	  template: `
		<div class="crm-repeat-sale__sandbox_container">
			<div class="ui-form">
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">
							{{segmentSelectorTitle}}
						</div>
					</div>
					<div class="ui-form-content">
						<SegmentSelector
							:current-segment-id="currentSegmentId"
							:segments="segments"
							@onSelectItem="onSelectSegment"
						/>
					</div>
				</div>
				
				<div class="ui-form-row">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">
							{{promptTitle}}
						</div>
					</div>
					<div class="ui-form-content">
						<TextEditorWrapperComponent
							:textEditor="textEditor"
						/>
					</div>
				</div>
				
				<div class="crm-repeat-sale__sandbox_mode_container">
					<div class="crm-repeat-sale__sandbox_mode">
						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">
									{{clientSelectorTitle}}
								</div>
							</div>
							<div class="ui-form-content">
								<ClientSelector
									:current-entity-id="currentClientId"
									:current-entity-type-id="currentClientTypeId"
									:entity-types="clientEntityTypes"
									@onSelectItem="onSelectClient"
								/>
							</div>
						</div>

						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">
									{{dealSelectorTitle}}
								</div>
							</div>
							<div class="ui-form-content">
								<ClientSelector
									:current-entity-id="currentEntityId"
									:current-entity-type-id="currentEntityTypeId"
									:entity-types="dealEntityTypes"
									@onSelectItem="onSelectDeal"
								/>
							</div>
						</div>
						
						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">
									{{dateTitle}}
								</div>
							</div>
							<div class="ui-form-content">
								<div class="ui-ctl">
									<input
										@click="showDatePicker"
										type="text"
										ref="datePicker"
										class="ui-ctl-element"
										:value="formattedDate"
									/>
								</div>
							</div>
						</div>
						
						<div class="ui-form-row">
							<div class="ui-form-content">
								<button class="ui-btn" @click="checkItem">{{isSuitableItemCheckTitle}}</button>
								<div v-if="isSuitableItem !== null" class="ui-form-row">
									{{ isSuitableItem ? isSuitableItemTitle : isNotSuitableItemTitle }}
								</div>
							</div>
						</div>
						
						<div class="ui-form-row-inline">
							<div class="ui-form-content">
								<button class="ui-btn" @click="fetchMarkers">{{submitTitle}}</button>
								<button class="ui-btn" v-if="hasFilledMarkers" @click="hideMarkers">{{hideTitle}}</button>
							</div>
						</div>
						
						<div
							v-if="hasFilledMarkers"
							class="ui-form-row crm-repeat-sale__sandbox_filled-markers"
						>
							<div class="ui-form-content">
								<pre>{{ JSON.stringify(markers, null, 2) }}</pre>
							</div>
						</div>
				
						<div class="ui-form-row">
							<div class="ui-form-content">
								<button class="ui-btn" @click="sendToAi">{{sendToAiTitle}}</button>
							</div>
						</div>
					</div>
					<div class="crm-repeat-sale__sandbox_mode">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">{{datePeriodTitle}}</div>
						</div>
						<div class="ui-form-row">
							<div class="ui-form-content">
								<div>
									{{datePeriodFromTitle}}
								</div>
								<div class="ui-ctl">
									<input
										@click="showFromPeriodDatePicker"
										type="text"
										ref="fromPeriodDatePicker"
										class="ui-ctl-element"
										:value="fromPeriodFormattedDate"
									/>
								</div>
							</div>
						</div>
						
						<div class="ui-form-row">
							<div class="ui-form-content">
								<div>
									{{datePeriodToTitle}}
								</div>
								<div class="ui-ctl">
									<input
										@click="showToPeriodDatePicker"
										type="text"
										ref="toPeriodDatePicker"
										class="ui-ctl-element"
										:value="toPeriodFormattedDate"
									/>
								</div>
							</div>
						</div>
						
						<div class="ui-form-row-inline">
							<div class="ui-form-content">
								<button class="ui-btn" @click="checkPeriod">{{periodCheckTitle}}</button>
								<button class="ui-btn" v-if="hasSuitableItems" @click="hideSuitableItems">{{hideTitle}}</button>
							</div>
						</div>
						
						<div class="ui-form-row" v-if="hasSuitableItems">
							<div class="ui-form-content">
								<div class="crm-repeat-sale__sandbox_suitable-item-wrapper">
									<div
										class="crm-repeat-sale__sandbox_suitable-item"
										v-for="(item, index) in suitableItems"
									>
										<i>{{ index+1 }}. </i>
										<a :href="getItemUrl(item.entityTypeId, item.entityId)">
											{{ getItemUrl(item.entityTypeId, item.entityId) }}
										</a>
									</div>
									<p>{{ periodCheckInfoTitle }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _app = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("app");
	var _textEditor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textEditor");
	var _getTextEditor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTextEditor");
	class Sandbox$1 {
	  constructor(containerId, params = {}) {
	    var _params$data$prompt, _params$events$onItem, _params$events;
	    Object.defineProperty(this, _getTextEditor, {
	      value: _getTextEditor2
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _app, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _textEditor, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = document.getElementById(containerId);
	    if (!main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container])) {
	      throw new Error('container not found');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app] = ui_vue3.BitrixVue.createApp(Sandbox, {
	      textEditor: babelHelpers.classPrivateFieldLooseBase(this, _getTextEditor)[_getTextEditor]((_params$data$prompt = params.data.prompt) != null ? _params$data$prompt : '', {}),
	      segments: params.data.segments,
	      onItemSentToAi: (_params$events$onItem = (_params$events = params.events) == null ? void 0 : _params$events.onItemSentToAi) != null ? _params$events$onItem : null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].mount(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	  }
	}
	function _getTextEditor2(prompt) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _textEditor)[_textEditor] !== null) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _textEditor)[_textEditor];
	  }
	  const floatingToolbar = ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list'];
	  babelHelpers.classPrivateFieldLooseBase(this, _textEditor)[_textEditor] = new ui_textEditor.BasicEditor({
	    editable: true,
	    removePlugins: ['BlockToolbar'],
	    minHeight: 250,
	    maxHeight: 400,
	    content: prompt,
	    placeholder: main_core.Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PROMPT_PLACEHOLDER'),
	    toolbar: [],
	    floatingToolbar,
	    collapsingMode: false
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _textEditor)[_textEditor];
	}

	exports.Sandbox = Sandbox$1;

}((this.BX.Crm.RepeatSale = this.BX.Crm.RepeatSale || {}),BX.Vue3,BX.Crm.Timeline,BX.Main,BX,BX,BX.UI.TextEditor,BX.Crm.Vue3));
//# sourceMappingURL=sandbox.bundle.js.map
