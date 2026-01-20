/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports,ui_vue3,crm_timeline_tools,main_date,main_popup,ui_datePicker,ui_loader,ui_mail_providerShowcase,ui_sidepanel,main_core_events,ui_entitySelector,main_core) {
	'use strict';

	const modeItems = Object.freeze({
	  none: {
	    value: 'N',
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MODE_ITEM_NONE')
	  },
	  multiple: {
	    value: '2',
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MODE_ITEM_MULTIPLE')
	  },
	  single: {
	    value: '1',
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MODE_ITEM_SINGLE')
	  }
	});
	function getModeByValue(value) {
	  var _Object$values$find;
	  return (_Object$values$find = Object.values(modeItems).find(item => item.value === value)) != null ? _Object$values$find : null;
	}

	const multipleLimits = Object.freeze({
	  no: {
	    value: 'N',
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_NO')
	  },
	  date: {
	    value: 'D',
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_DATE')
	  },
	  times: {
	    value: 'T',
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_TIMES')
	  }
	});
	function getMultipleLimitByValue(value) {
	  var _Object$values$find;
	  return (_Object$values$find = Object.values(multipleLimits).find(item => item.value === value)) != null ? _Object$values$find : null;
	}

	const multipleTypes = Object.freeze({
	  day: {
	    value: 1,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_DAY')
	  },
	  week: {
	    value: 2,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_WEEK')
	  },
	  month: {
	    value: 3,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_MONTH')
	  },
	  year: {
	    value: 4,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_YEAR')
	  },
	  custom: {
	    value: 5,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_CUSTOM')
	  }
	});
	function getMultipleTypeByValue(value) {
	  var _Object$values$find;
	  return (_Object$values$find = Object.values(multipleTypes).find(item => item.value === value)) != null ? _Object$values$find : null;
	}

	const offsetDateTypes = Object.freeze({
	  set: 0,
	  calculated: 1
	});

	const periods = Object.freeze({
	  day: {
	    value: 1,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_DAY'),
	    titleGenitive: main_core.Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PERIOD_DAY'),
	    extended: false
	  },
	  week: {
	    value: 2,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_WEEK'),
	    titleGenitive: main_core.Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PERIOD_WEEK'),
	    extended: false
	  },
	  month: {
	    value: 3,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_MONTH'),
	    titleGenitive: main_core.Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PERIOD_MONTH'),
	    extended: false
	  },
	  year: {
	    value: 4,
	    title: main_core.Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_YEAR'),
	    extended: true
	  }
	});
	function getPeriods(withExtended = false) {
	  if (withExtended) {
	    return periods;
	  }
	  const result = {};
	  Object.keys(periods).forEach(periodName => {
	    if (periods[periodName].extended === false) {
	      result[periodName] = periods[periodName];
	    }
	  });
	  return Object.freeze(result);
	}
	function getPeriodByValue(value) {
	  var _Object$values$find;
	  return (_Object$values$find = Object.values(periods).find(item => item.value === value)) != null ? _Object$values$find : null;
	}

	function showPopupMenu(id, target, menu) {
	  main_popup.PopupMenu.show(id, target, menu, {
	    angle: false,
	    width: target.offsetWidth + 'px'
	  });
	  main_popup.PopupMenu.currentItem.popupWindow.setWidth(BX.pos(target).width);
	}
	function destroyPopupMenu(id) {
	  main_popup.PopupMenu.destroy(id);
	}
	function createDatePickerInstance(date, callback) {
	  return new ui_datePicker.DatePicker({
	    selectedDates: [new Date(date)],
	    events: {
	      onSelectChange: event => {
	        callback(event);
	      }
	    }
	  });
	}
	function getFormattedDate(date) {
	  return main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateFormat(), date);
	}
	function resolveEntityTypeName(entityTypeId) {
	  if (BX.CrmEntityType.isDynamicTypeByTypeId(entityTypeId)) {
	    return 'DYNAMIC';
	  }
	  return entityTypeId === BX.CrmEntityType.enumeration.dealrecurring ? BX.CrmEntityType.names.deal : BX.CrmEntityType.resolveName(entityTypeId);
	}

	const FieldTitle = {
	  props: {
	    title: {
	      type: String,
	      required: true
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
			<label class="ui-entity-editor-block-title-text">{{title}}</label>
		</div>
	`
	};

	const HiddenInput = {
	  props: {
	    name: {
	      type: String,
	      required: true
	    },
	    value: {
	      type: [String, Number],
	      required: true
	    },
	    changeCallback: {
	      type: Function,
	      default: () => {}
	    }
	  },
	  watch: {
	    value() {
	      void this.$nextTick(() => {
	        this.changeCallback(this.$refs.input);
	      });
	    }
	  },
	  // language=Vue
	  template: `
		<input ref="input" :name="name" :value="value" type="hidden">
	`
	};

	const LOADER_SIZE = 'xs';
	const LOADER_TYPE = 'BULLET';

	// @vue/component
	const Loader = {
	  mounted() {
	    this.loader = new ui_loader.Loader({
	      target: this.$refs.loader,
	      type: LOADER_TYPE,
	      size: LOADER_SIZE
	    });
	    this.loader.render();
	    this.loader.show();
	  },
	  beforeUnmount() {
	    this.loader.hide();
	    this.loader = null;
	  },
	  template: `
		<div class="crm-entity-widget-content-block-recurring-loader" ref="loader"></div>
	`
	};

	let _ = t => t,
	  _t;
	const DEFAULT_TAB_ID = 'default';
	const DocumentSelector = {
	  props: {
	    documentId: {
	      type: Number,
	      required: true
	    },
	    documents: {
	      type: Array,
	      required: true
	    },
	    documentUrl: {
	      type: String,
	      required: true
	    }
	  },
	  components: {
	    FieldTitle
	  },
	  data() {
	    return {
	      currentDocumentId: this.documentId
	    };
	  },
	  methods: {
	    showDocumentDialog(event) {
	      const dialog = this.getDocumentDialog();
	      dialog.setTargetNode(event.target);
	      dialog.show();
	    },
	    getDocumentDialog() {
	      if (!this.documentDialog) {
	        const items = this.getItems();
	        this.documentDialog = new ui_entitySelector.Dialog({
	          multiple: false,
	          dropdownMode: true,
	          showAvatars: true,
	          enableSearch: items.length > 8,
	          width: 500,
	          height: 300,
	          zIndex: 2500,
	          items,
	          tabs: this.getTabs(),
	          footer: this.getFooter(),
	          events: {
	            'Item:onSelect': this.onSelectDocument,
	            'Item:onDeselect': this.onDeselectDocument
	          }
	        });
	      }
	      return this.documentDialog;
	    },
	    onSelectDocument(event) {
	      const {
	        item: {
	          id
	        }
	      } = event.getData();
	      this.currentDocumentId = id;
	      this.emitChanges();
	    },
	    onDeselectDocument() {
	      this.currentDocumentId = null;
	      this.emitChanges();
	    },
	    emitChanges() {
	      void this.$nextTick(() => {
	        this.$emit('onChange', this.currentDocumentId);
	      });
	    },
	    getCurrentDocument() {
	      const document = this.documents.find(item => item.id === this.currentDocumentId);
	      return main_core.Type.isObject(document) ? document : null;
	    },
	    getTabs() {
	      return [{
	        id: DEFAULT_TAB_ID,
	        title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_TAB_TITLE_SMART_INVOICE'),
	        stub: true,
	        stubOptions: {
	          title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_DOCUMENT_TITLE_SMART_INVOICE'),
	          subtitle: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_DOCUMENT_SUBTITLE_SMART_INVOICE'),
	          arrow: true
	        }
	      }];
	    },
	    getItems() {
	      const items = [];
	      this.documents.forEach(template => {
	        items.push(this.createDialogItem(template));
	      });
	      return items;
	    },
	    createDialogItem(template) {
	      return {
	        id: template.id,
	        title: template.title,
	        entityId: DEFAULT_TAB_ID,
	        tabs: DEFAULT_TAB_ID
	      };
	    },
	    getFooter() {
	      return main_core.Tag.render(_t || (_t = _`
				<div class="crm-entity-editor-recurring-template-selector-footer">
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${0}">
						${0}
					</span>
				</div>
			`), this.createNewDocumentHandler, this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_ADD'));
	    },
	    createNewDocumentHandler() {
	      this.showDocumentsSidePanel(this.documentUrl);
	    },
	    showDocumentsSidePanel(url) {
	      ui_sidepanel.SidePanel.Instance.open(url, {
	        cacheable: false,
	        width: 1080,
	        events: {
	          onClose: async () => {
	            this.$emit('onReInit');
	          }
	        }
	      });
	    }
	  },
	  watch: {
	    documentId(newValue) {
	      if (Number(this.documentId) !== Number(this.currentDocumentId)) {
	        this.currentDocumentId = Number(newValue);
	      }
	    },
	    documents: {
	      handler() {
	        const dialog = this.getDocumentDialog();
	        dialog.removeItems();
	        this.documents.forEach(template => {
	          dialog.addItem(this.createDialogItem(template));
	        });
	      },
	      deep: true
	    }
	  },
	  computed: {
	    documentTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_FIELD_SMART_INVOICE');
	    },
	    documentName() {
	      const document = this.getCurrentDocument();
	      return document ? document.title : null;
	    },
	    placeholder() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_DOCUMENT_FIELD_PLACEHOLDER');
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label for="" class="ui-entity-editor-block-title-text">
					{{documentTitle}}
				</label>
			</div>
			<div
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
				@click="showDocumentDialog"
			>
				<div v-if="documentName" class="ui-ctl-element">{{documentName}}</div>
				<div v-else class="ui-ctl-element placeholder" :data-placeholder="placeholder"></div>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			</div>
		</div>
	`
	};

	let _$1 = t => t,
	  _t$1;
	const DEFAULT_TAB_ID$1 = 'default';
	const SenderSelector = {
	  props: {
	    senderId: {
	      type: Number,
	      required: true
	    },
	    senders: {
	      type: Array,
	      required: true
	    }
	  },
	  components: {
	    FieldTitle
	  },
	  data() {
	    return {
	      currentSenderId: this.senderId
	    };
	  },
	  methods: {
	    showSenderDialog(event) {
	      const dialog = this.getSenderDialog();
	      dialog.setTargetNode(event.target);
	      dialog.show();
	    },
	    getSenderDialog() {
	      if (!this.senderDialog) {
	        const items = this.getItems();
	        this.senderDialog = new ui_entitySelector.Dialog({
	          multiple: false,
	          dropdownMode: true,
	          showAvatars: true,
	          enableSearch: items.length > 8,
	          width: 500,
	          height: 300,
	          zIndex: 2500,
	          tabs: this.getTabs(),
	          items,
	          selectedItems: this.getSelectedItems(),
	          footer: this.getFooter(),
	          events: {
	            'Item:onSelect': this.onSelectSender,
	            'Item:onDeselect': this.onDeselectSender
	          }
	        });
	      }
	      return this.senderDialog;
	    },
	    getTabs() {
	      return [{
	        id: DEFAULT_TAB_ID$1,
	        title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_SENDER_TITLE'),
	        stub: true,
	        stubOptions: {
	          title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_SENDER_TITLE'),
	          subtitle: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_SENDER_SUBTITLE_SMART_INVOICE'),
	          arrow: true
	        }
	      }];
	    },
	    getItems() {
	      const items = [];
	      this.senders.forEach(sender => {
	        items.push(this.createDialogItem(sender));
	      });
	      return items;
	    },
	    getSelectedItems() {
	      const items = [];
	      this.senders.forEach(sender => {
	        if (Number(this.senderId) === Number(sender.id)) {
	          items.push(this.createDialogItem(sender));
	        }
	      });
	      return items;
	    },
	    createDialogItem(sender) {
	      return {
	        id: sender.id,
	        title: sender.email,
	        subtitle: sender.name,
	        entityId: DEFAULT_TAB_ID$1,
	        tabs: DEFAULT_TAB_ID$1
	      };
	    },
	    getFooter() {
	      return main_core.Tag.render(_t$1 || (_t$1 = _$1`
				<div class="crm-entity-editor-recurring-template-selector-footer">
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${0}">
						${0}
					</span>
				</div>
			`), this.createNewSenderHandler, this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_NEW_SENDER'));
	    },
	    createNewSenderHandler() {
	      ui_mail_providerShowcase.ProviderShowcase.openSlider({
	        setSenderCallback: (senderId, senderName, senderEmail) => {
	          this.$emit('onReInit');
	        }
	      });
	    },
	    onSelectSender(event) {
	      const {
	        item: {
	          id
	        }
	      } = event.getData();
	      this.currentSenderId = id;
	      this.emitChanges();
	    },
	    onDeselectSender() {
	      this.currentSenderId = null;
	      this.emitChanges();
	    },
	    emitChanges() {
	      this.$emit('onChange', this.currentSenderId);
	    },
	    getCurrentSender() {
	      const sender = this.senders.find(item => Number(item.id) === Number(this.senderId));
	      return main_core.Type.isObject(sender) ? sender : null;
	    }
	  },
	  watch: {
	    senderId(newValue) {
	      if (Number(this.senderId) !== Number(this.currentSenderId)) {
	        this.currentSenderId = Number(newValue);
	      }
	    },
	    senders: {
	      handler() {
	        const senderDialog = this.getSenderDialog();
	        senderDialog.removeItems();
	        this.senders.forEach(sender => {
	          senderDialog.addItem(this.createDialogItem(sender));
	        });

	        // const sender = this.getCurrentSender();
	        // this.$refs.sender.innerText = sender ? `${sender.name} (${sender.email})` : '';
	      },

	      deep: true
	    }
	  },
	  computed: {
	    senderTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SENDER_FIELD');
	    },
	    senderName() {
	      const sender = this.getCurrentSender();
	      return sender ? sender.email : null;
	    },
	    placeholder() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SENDER_FIELD_PLACEHOLDER');
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label for="" class="ui-entity-editor-block-title-text">
					{{senderTitle}}
				</label>
			</div>
			<div
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
				@click="showSenderDialog"
			>
				<div v-if="senderName" class="ui-ctl-element">{{senderName}}</div>
				<div v-else class="ui-ctl-element placeholder" :data-placeholder="placeholder"></div>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			</div>
		</div>
	`
	};

	let _$2 = t => t,
	  _t$2;
	const DEFAULT_TAB_ID$2 = 'default';
	const TemplateSelector = {
	  props: {
	    entityTypeId: {
	      type: Number,
	      required: true
	    },
	    templateId: {
	      type: Number,
	      required: true
	    },
	    templates: {
	      type: Array,
	      required: true
	    }
	  },
	  components: {
	    FieldTitle
	  },
	  data() {
	    return {
	      currentTemplateId: this.templateId
	    };
	  },
	  methods: {
	    showTemplateDialog(event) {
	      const dialog = this.getTemplateDialog();
	      dialog.setTargetNode(event.target);
	      dialog.show();
	    },
	    getTemplateDialog() {
	      if (!this.templateDialog) {
	        const items = this.getItems();
	        this.templateDialog = new ui_entitySelector.Dialog({
	          multiple: false,
	          dropdownMode: true,
	          showAvatars: true,
	          enableSearch: items.length > 8,
	          width: 500,
	          height: 300,
	          zIndex: 2500,
	          tabs: this.getTabs(),
	          items,
	          selectedItems: this.getSelectedItems(),
	          footer: this.getFooter(),
	          events: {
	            'Item:onSelect': this.onSelectTemplate,
	            'Item:onDeselect': this.onDeselectTemplate
	          }
	        });
	      }
	      return this.templateDialog;
	    },
	    getTabs() {
	      return [{
	        id: DEFAULT_TAB_ID$2,
	        title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TEMPLATE_TITLE'),
	        stub: true,
	        stubOptions: {
	          title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TEMPLATE_TITLE'),
	          subtitle: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TEMPLATE_SUBTITLE_SMART_INVOICE'),
	          arrow: true
	        }
	      }];
	    },
	    getItems() {
	      const items = [];
	      this.templates.forEach(template => {
	        items.push(this.createDialogItem(template));
	      });
	      return items;
	    },
	    getSelectedItems() {
	      const items = [];
	      this.templates.forEach(template => {
	        if (Number(this.templateId) === Number(template.id)) {
	          items.push(this.createDialogItem(template));
	        }
	      });
	      return items;
	    },
	    createDialogItem(template) {
	      return {
	        id: template.id,
	        title: template.title,
	        entityId: DEFAULT_TAB_ID$2,
	        tabs: DEFAULT_TAB_ID$2
	      };
	    },
	    getFooter() {
	      return main_core.Tag.render(_t$2 || (_t$2 = _$2`
				<div class="crm-entity-editor-recurring-template-selector-footer">
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${0}">
						${0}
					</span>
					<span class="ui-selector-footer-link" onclick="${0}">
						${0}
					</span>
				</div>
			`), this.createNewEmailTemplateHandler, this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_NEW_TEMPLATE'), this.showEmailTemplatesList, this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SHOW_TEMPLATES_LIST'));
	    },
	    createNewEmailTemplateHandler() {
	      let url = '/crm/configs/mailtemplate/add/';
	      const urlParams = {
	        ENTITY_TYPE_ID: this.entityTypeId
	      };
	      url = BX.util.add_url_param(url, urlParams);
	      this.showEmailTemplatesSidePanel(url, true);
	    },
	    showEmailTemplatesList() {
	      const url = '/crm/configs/mailtemplate/';
	      this.showEmailTemplatesSidePanel(url, false);
	    },
	    showEmailTemplatesSidePanel(url, isReInit) {
	      ui_sidepanel.SidePanel.Instance.open(url, {
	        cacheable: false,
	        width: 1080,
	        events: {
	          onClose: async () => {
	            if (isReInit) {
	              this.$emit('onReInit');
	            }
	          }
	        }
	      });
	    },
	    onSelectTemplate(event) {
	      const {
	        item: {
	          id
	        }
	      } = event.getData();
	      this.currentTemplateId = id;
	      this.emitChanges();
	    },
	    onDeselectTemplate() {
	      this.currentTemplateId = null;
	      this.emitChanges();
	    },
	    emitChanges() {
	      void this.$nextTick(() => {
	        this.$emit('onChange', this.currentTemplateId);
	      });
	    },
	    getCurrentTemplate() {
	      const template = this.templates.find(item => Number(item.id) === Number(this.currentTemplateId));
	      return main_core.Type.isObject(template) ? template : null;
	    }
	  },
	  watch: {
	    templateId(newValue) {
	      if (Number(this.templateId) !== Number(this.currentTemplateId)) {
	        this.currentTemplateId = Number(newValue);
	      }
	    },
	    templates: {
	      handler() {
	        const templateDialog = this.getTemplateDialog();
	        templateDialog.removeItems();
	        this.templates.forEach(template => {
	          templateDialog.addItem(this.createDialogItem(template));
	        });

	        // const template = this.getCurrentTemplate();
	        // this.$refs.template.innerText = template ? template.title : '';
	      },

	      deep: true
	    }
	  },
	  computed: {
	    templateTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TEMPLATE_FIELD');
	    },
	    templateName() {
	      const template = this.getCurrentTemplate();
	      return template ? template.title : null;
	    },
	    placeholder() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TEMPLATE_FIELD_PLACEHOLDER');
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label class="ui-entity-editor-block-title-text">
					{{templateTitle}}
				</label>
			</div>
			<div
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
				@click="showTemplateDialog"
			>
				<div v-if="templateName" class="ui-ctl-element">{{templateName}}</div>
				<div v-else class="ui-ctl-element placeholder" :data-placeholder="placeholder"></div>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			</div>
		</div>
	`
	};

	let _$3 = t => t,
	  _t$3;
	const DEFAULT_TAB_ID$3 = 'default';
	const ToEmailSelector = {
	  props: {
	    entityId: {
	      type: Number,
	      required: true
	    },
	    entityTypeId: {
	      type: Number,
	      required: true
	    },
	    communications: {
	      type: Array,
	      required: true,
	      default: []
	    },
	    emailIds: {
	      type: Array,
	      required: true
	    }
	  },
	  components: {
	    FieldTitle
	  },
	  data() {
	    const preparedEmailIds = this.emailIds.filter(emailId => emailId > 0).map(emailId => Number(emailId));
	    return {
	      currentEmailIds: new Set(preparedEmailIds),
	      currentCommunications: this.communications
	    };
	  },
	  mounted() {
	    this.initToEmailTagSelector();
	  },
	  methods: {
	    initToEmailTagSelector() {
	      if (!this.toEmailTagSelector) {
	        const tagSelectorConfig = {
	          multiple: true,
	          dialogOptions: {
	            width: 400,
	            height: 300,
	            multiple: false,
	            dropdownMode: true,
	            showAvatars: true,
	            compactView: false,
	            tabs: this.getTabs(),
	            items: this.getItems(),
	            selectedItems: this.getSelectedItems(),
	            footer: this.entityId > 0 ? this.getFooter() : null,
	            events: {
	              'Item:onSelect': this.onSelectEmail,
	              'Item:onDeselect': this.onDeselectEmail
	            }
	          }
	        };
	        this.toEmailTagSelector = new ui_entitySelector.TagSelector(tagSelectorConfig);
	        this.toEmailTagSelector.renderTo(this.$refs.toEmailContainer);
	      }
	    },
	    getTabs() {
	      let subtitle = 'CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TO_EMAIL_SUBTITLE_SMART_INVOICE';
	      if (this.entityId <= 0) {
	        subtitle = `${subtitle}_NEW`;
	      }
	      return [{
	        id: DEFAULT_TAB_ID$3,
	        title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TO_EMAIL_TAB_TITLE'),
	        stubOptions: {
	          title: this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_EMPTY_STATE_TO_EMAIL_TITLE'),
	          subtitle: this.$Bitrix.Loc.getMessage(subtitle),
	          arrow: true
	        }
	      }];
	    },
	    getItems() {
	      const items = [];
	      this.currentCommunications.forEach(communication => {
	        communication.emails.forEach(email => {
	          items.push(this.createDialogItem(email, communication));
	        });
	      });
	      return items;
	    },
	    getSelectedItems() {
	      const selectedItems = [];
	      this.currentEmailIds.forEach(emailId => {
	        const email = this.getEmailById(emailId);
	        if (email) {
	          selectedItems.push(this.createDialogItem(email));
	        }
	      });
	      return selectedItems;
	    },
	    getEmailById(emailId) {
	      const emails = this.currentCommunications.flatMap(communication => {
	        return communication.emails.map(email => {
	          return {
	            ...email,
	            caption: communication.caption
	          };
	        });
	      });
	      const email = emails.find(item => Number(item.id) === Number(emailId));
	      return email != null ? email : null;
	    },
	    createDialogItem(email, communication = null) {
	      return {
	        id: email.id,
	        title: email.value,
	        subtitle: communication ? this.getEmailSubtitle(communication, email) : '',
	        entityId: DEFAULT_TAB_ID$3,
	        tabs: DEFAULT_TAB_ID$3
	      };
	    },
	    getEmailSubtitle(item, email) {
	      return `${item.caption} (${email.typeLabel})`;
	    },
	    getFooter() {
	      return main_core.Tag.render(_t$3 || (_t$3 = _$3`
				<div class="crm-entity-editor-recurring-template-selector-footer">
					<span class="ui-selector-footer-link ui-selector-footer-link-add" onclick="${0}">
						${0}
					</span>
				</div>
			`), this.addClientHandler.bind(this), this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_BIND_CLIENT'));
	    },
	    onSelectEmail(event) {
	      const {
	        item: {
	          id
	        }
	      } = event.getData();
	      this.currentEmailIds.add(id);
	      this.emitChanges();
	    },
	    onDeselectEmail(event) {
	      const {
	        item: {
	          id
	        }
	      } = event.getData();
	      this.currentEmailIds.delete(id);
	      this.emitChanges();
	    },
	    emitChanges() {
	      void this.$nextTick(() => {
	        this.$emit('onChange', [...this.currentEmailIds.values()]);
	      });
	    },
	    addClientHandler(event) {
	      const id = 'client-selector-dialog';
	      const entityTypeId = this.entityTypeId;
	      const context = `CRM_RECURRING-${entityTypeId}`;
	      if (!this.userSelectorDialog) {
	        this.userSelectorDialog = new ui_entitySelector.Dialog({
	          id,
	          context,
	          targetNode: event.target,
	          multiple: false,
	          dropdownMode: false,
	          showAvatars: true,
	          enableSearch: true,
	          width: 450,
	          zIndex: 2500,
	          entities: this.getClientSelectorEntities(),
	          events: {
	            'Item:onSelect': this.onSelectClient
	          }
	        });
	      }
	      if (this.userSelectorDialog.isOpen()) {
	        this.userSelectorDialog.hide();
	      } else {
	        this.userSelectorDialog.show();
	      }
	    },
	    getClientSelectorEntities() {
	      const contact = {
	        id: 'contact',
	        dynamicLoad: true,
	        dynamicSearch: true,
	        options: {
	          showTab: true,
	          showPhones: true,
	          showMails: true
	        }
	      };
	      const company = {
	        id: 'company',
	        dynamicLoad: true,
	        dynamicSearch: true,
	        options: {
	          excludeMyCompany: true,
	          showTab: true,
	          showPhones: true,
	          showMails: true
	        }
	      };
	      return [contact, company];
	    },
	    async onSelectClient(event) {
	      const {
	        item
	      } = event.getData();
	      this.selectedClient = {
	        entityId: item.id,
	        entityTypeId: BX.CrmEntityType.resolveId(item.entityId)
	      };
	      const isBound = await this.bindClient();
	      if (isBound) {
	        var _this$currentCommunic, _this$currentCommunic2;
	        BX.Crm.EntityEditor.getDefault().reload();
	        const id = (_this$currentCommunic = this.currentCommunications[0]) == null ? void 0 : (_this$currentCommunic2 = _this$currentCommunic.emails[0]) == null ? void 0 : _this$currentCommunic2.id;
	        if (id) {
	          this.currentEmailIds.add(id);
	          this.emitChanges();
	        }
	      }
	    },
	    async bindClient() {
	      const {
	        entityId: clientId,
	        entityTypeId: clientTypeId
	      } = this.selectedClient;
	      const ajaxParams = {
	        entityId: this.entityId,
	        entityTypeId: this.entityTypeId,
	        clientId,
	        clientTypeId
	      };
	      return new Promise(resolve => {
	        main_core.ajax.runAction('crm.recurring.mail.bindClient', {
	          data: ajaxParams
	        }).then(({
	          data
	        }) => {
	          if (!data) {
	            resolve(false);
	          }
	          const {
	            communications
	          } = data;
	          this.currentCommunications = communications;
	          this.currentCommunications.forEach(communication => {
	            communication.emails.forEach(email => {
	              this.toEmailTagSelector.addTag(this.createDialogItem(email, communication));
	            });
	          });
	          this.$emit('onReInit');
	          this.emitChanges();
	          resolve(true);
	        }).catch(data => {
	          this.showNotify(this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_ERROR'));
	        });
	      });
	    },
	    // eslint-disable-next-line class-methods-use-this
	    showNotify(content) {
	      BX.UI.Notification.Center.notify({
	        content
	      });
	    }
	  },
	  watch: {
	    emailIds(emailIds) {
	      this.currentEmailIds = new Set(emailIds != null ? emailIds : []);
	    },
	    communications: {
	      handler(data) {
	        this.currentCommunications = data;
	        this.toEmailTagSelector = null;
	        main_core.Dom.clean(this.$refs.toEmailContainer);
	        this.initToEmailTagSelector();
	      },
	      deep: true
	    }
	  },
	  computed: {
	    communicationsTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_COMMUNICATIONS_FIELD');
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
				<label for="" class="ui-entity-editor-block-title-text">
					{{communicationsTitle}}
				</label>
			</div>
			<div ref="toEmailContainer"></div>
		</div>
	`
	};

	const EmailFields = {
	  props: {
	    entityTypeId: {
	      type: Number,
	      required: true
	    },
	    entityId: {
	      type: Number,
	      required: true
	    },
	    data: {
	      type: Object,
	      default: {}
	    },
	    changeCallback: {
	      type: Function,
	      required: true
	    }
	  },
	  components: {
	    FieldTitle,
	    HiddenInput,
	    Loader,
	    TemplateSelector,
	    DocumentSelector,
	    SenderSelector,
	    ToEmailSelector
	  },
	  data() {
	    var _this$data$templateId, _this$data$documentId, _this$data$senderId, _this$data$isEnabled, _this$data$emailIds;
	    return {
	      isFetchedConfig: false,
	      templateId: (_this$data$templateId = this.data.templateId) != null ? _this$data$templateId : null,
	      documentId: (_this$data$documentId = this.data.documentId) != null ? _this$data$documentId : null,
	      senderId: (_this$data$senderId = this.data.senderId) != null ? _this$data$senderId : null,
	      isEnabled: (_this$data$isEnabled = this.data.isEnabled) != null ? _this$data$isEnabled : false,
	      emailIds: (_this$data$emailIds = this.data.emailIds) != null ? _this$data$emailIds : [],
	      config: null
	    };
	  },
	  mounted() {
	    if (this.isEnabled && !this.isFetchedConfig) {
	      this.updateConfig();
	    }
	  },
	  methods: {
	    async setTemplateId(templateId) {
	      if (this.templateId !== templateId) {
	        this.templateId = templateId;
	      }
	    },
	    async setDocumentId(documentId) {
	      if (this.documentId !== documentId) {
	        this.documentId = documentId;
	      }
	    },
	    async setSenderId(senderId) {
	      if (this.senderId !== senderId) {
	        this.senderId = senderId;
	      }
	    },
	    async setEmailIds(emailIds) {
	      const isEqualsArrays = (a, b) => {
	        if (a.length !== b.length) {
	          return false;
	        }
	        const sortedA = [...a].sort();
	        const sortedB = [...b].sort();
	        return sortedA.every((value, index) => value === sortedB[index]);
	      };
	      if (!isEqualsArrays([...this.emailIds], emailIds)) {
	        this.emailIds = emailIds;

	        // change-callback on HiddenInput doesn't work for array values
	        this.changeCallback({
	          name: 'RECURRING[EMAIL_IDS]',
	          value: [...this.emailIds]
	        });
	      }
	    },
	    async updateConfig() {
	      this.config = await this.fetchConfig();
	    },
	    async fetchConfig() {
	      const ajaxParameters = {
	        entityTypeId: this.entityTypeId,
	        entityId: this.entityId
	      };
	      return new Promise(resolve => {
	        main_core.ajax.runAction('crm.recurring.mail.getConfig', {
	          data: ajaxParameters
	        }).then(response => {
	          this.isFetchedConfig = true;
	          const data = response.data;
	          if (this.templateId === null) {
	            var _data$templates$0$id, _data$templates$;
	            this.templateId = (_data$templates$0$id = (_data$templates$ = data.templates[0]) == null ? void 0 : _data$templates$.id) != null ? _data$templates$0$id : null;
	          }
	          resolve(response.data);
	        }).catch(() => {
	          this.showNotify(this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_ERROR'));
	          this.isFetchedConfig = true;
	        });
	      });
	    },
	    // eslint-disable-next-line class-methods-use-this
	    showNotify(content) {
	      BX.UI.Notification.Center.notify({
	        content
	      });
	    },
	    focus() {
	      this.$refs.isEnabledTemplate.focus();
	    },
	    //@todo need?
	    getData() {
	      var _this$toEmailTagSelec;
	      const emails = (_this$toEmailTagSelec = this.toEmailTagSelector) == null ? void 0 : _this$toEmailTagSelec.getTags();
	      const emailIds = emails ? emails.map(item => item.id) : [];
	      return {
	        isEnabled: this.isEnabled,
	        templateId: this.templateId,
	        documentId: this.documentId,
	        senderId: this.senderId,
	        emailIds
	      };
	    }
	  },
	  watch: {
	    async isEnabled(isEnabled) {
	      if (!this.isFetchedConfig && isEnabled) {
	        this.config = await this.fetchConfig();
	      }
	    }
	  },
	  computed: {
	    title() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_TITLE_SMART_INVOICE');
	    },
	    containerClassList() {
	      return ['crm-entity-widget-content-block-inner', 'crm-entity-widget-content-block-colums-input', 'crm-entity-widget-content-block-recurring-email-section-container'];
	    },
	    fieldsBlockClassList() {
	      return {
	        'crm-recurring-mail-fields-container': true,
	        '--disabled': !this.isEnabled
	      };
	    },
	    checkboxLabelClassList() {
	      return {
	        'ui-ctl': true,
	        'ui-ctl-w100': true,
	        'ui-ctl-checkbox': true,
	        '--checked': this.isEnabled
	      };
	    },
	    isEnabledTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_EMAIL_SECTION_IS_ENABLED');
	    },
	    formattedIsEnabled() {
	      return this.isEnabled ? 'Y' : 'N';
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" />
			<div :class="containerClassList">
				<label :class="checkboxLabelClassList">
					<input
						type="checkbox"
						class="ui-ctl-element"
						v-model="isEnabled"
						ref="isEnabledTemplate"
						value="Y"
					>
					<span class="ui-ctl-label-text">{{isEnabledTitle}}</span>
				</label>

				<Loader v-if="isEnabled && !isFetchedConfig" />
				
				<div v-if="isEnabled && isFetchedConfig" :class="fieldsBlockClassList">
					
					<TemplateSelector
						v-if="config"
						:entityTypeId="entityTypeId"
						:templateId="Number(templateId)"
						:templates="config.templates"
						@onChange="setTemplateId"
						@onReInit="updateConfig"
					/>
					
					<DocumentSelector
						v-if="config"
						:documentId="Number(documentId)"
						:documents="config.documents"
						:documentUrl="config.documentUrl"
						@onChange="setDocumentId"
						@onReInit="updateConfig"
					/>

					<SenderSelector
						v-if="config"
						:senderId="Number(senderId)"
						:senders="config.senders"
						@onChange="setSenderId"
						@onReInit="updateConfig"
					/>
					
					<ToEmailSelector
						v-if="config"
						:entityId="entityId"
						:entityTypeId="entityTypeId"
						:communications="config.communications"
						:emailIds="emailIds"
						@onChange="setEmailIds"
						@onReInit="updateConfig"
					/>

					<HiddenInput :value="templateId" name="RECURRING[EMAIL_TEMPLATE_ID]" :change-callback="changeCallback" />
					<HiddenInput :value="documentId" name="RECURRING[EMAIL_DOCUMENT_ID]" :change-callback="changeCallback" />
					<HiddenInput :value="senderId" name="RECURRING[SENDER_ID]" :change-callback="changeCallback" />
					<HiddenInput v-for="emailId in emailIds" :key="emailId" :value="emailId" name="RECURRING[EMAIL_IDS][]" />
				</div>
				<HiddenInput :value="formattedIsEnabled" name="RECURRING[IS_SEND_EMAIL]" :change-callback="changeCallback" />
			</div>
		</div>	
	`
	};

	const popupMenuMixin = popupMenuId => ({
	  created() {
	    this.popupMenuId = popupMenuId;
	  },
	  beforeUnmount() {
	    if (main_core.Type.isArray(this.popupMenuId)) {
	      this.popupMenuId.forEach(popupId => destroyPopupMenu(popupId));
	    } else if (main_core.Type.isStringFilled(this.popupMenuId)) {
	      destroyPopupMenu(this.popupMenuId);
	    }
	  }
	});

	// @vue/component
	const CategorySelector = {
	  components: {
	    FieldTitle
	  },
	  mixins: [popupMenuMixin('crm-recurring-category-selector')],
	  props: {
	    categoryId: {
	      type: Number,
	      required: true
	    },
	    categories: {
	      type: Array,
	      required: true
	    }
	  },
	  computed: {
	    categoryTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_CATEGORY_TITLE');
	    },
	    currentCategoryTitle() {
	      const currentCategory = this.categories.find(item => Number(item.VALUE) === Number(this.categoryId));
	      return currentCategory ? currentCategory.NAME : this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_CATEGORY_TITLE_WITHOUT_PERMISSIONS');
	    }
	  },
	  methods: {
	    showCategorySelector() {
	      const menu = [];
	      this.categories.forEach(category => {
	        menu.push({
	          value: Number(category.VALUE),
	          text: category.NAME,
	          onclick: this.onChangeCategory.bind(this)
	        });
	      });
	      showPopupMenu(this.popupMenuId, this.$refs.categorySelector, menu);
	    },
	    onChangeCategory(_, item) {
	      this.$emit('onChange', item.value);
	      item.getMenuWindow().close();
	    }
	  },
	  // language=Vue
	  template: `
		<div>
			<FieldTitle :title="categoryTitle" />
		
			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="categorySelector"
						class="ui-ctl-element"
						@click="showCategorySelector"
					>
						{{currentCategoryTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const DateFields = {
	  components: {
	    FieldTitle
	  },
	  mixins: [popupMenuMixin(['crm-recurring-dates-section-selector-beginDate', 'crm-recurring-dates-section-selector-closeDate'])],
	  props: {
	    entityTypeId: {
	      type: Number,
	      required: true
	    },
	    isEditableDateStartField: {
	      type: Boolean,
	      default: true
	    },
	    dateStart: {
	      type: Number,
	      required: true
	    },
	    offsetBeginDateValue: {
	      type: Number,
	      required: true
	    },
	    offsetBeginDateType: {
	      type: Number,
	      required: true
	    },
	    offsetCloseDateValue: {
	      type: Number,
	      required: true
	    },
	    offsetCloseDateType: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      isShowOffsetBeginDate: this.offsetBeginDateValue > 0,
	      formData: {
	        currentDateStart: this.dateStart,
	        currentOffsetBeginDateValue: this.offsetBeginDateValue,
	        currentOffsetBeginDateType: this.offsetBeginDateType,
	        currentOffsetCloseDateValue: this.offsetCloseDateValue,
	        currentOffsetCloseDateType: this.offsetCloseDateType
	      },
	      isEmitting: false
	    };
	  },
	  computed: {
	    title() {
	      const entityTypeName = this.getEntityTypeName();
	      return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_DATE_FIELDS_TITLE_${entityTypeName}`);
	    },
	    startDateTitle() {
	      const entityTypeName = this.getEntityTypeName();
	      return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_DATES_SECTION_FIELD_DATE_CREATE_${entityTypeName}`);
	    },
	    formattedStartDate() {
	      return getFormattedDate(this.formData.currentDateStart);
	    },
	    beginDateTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_BEGINDATE_TYPE_TITLE');
	    },
	    closeDateTitle() {
	      const entityTypeName = this.getEntityTypeName();
	      return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_CLOSEDATE_TYPE_TITLE_${entityTypeName}`);
	    },
	    offsetBeginDateTypeTitle() {
	      return getPeriodByValue(this.formData.currentOffsetBeginDateType).title;
	    },
	    offsetCloseDateTypeTitle() {
	      return getPeriodByValue(this.formData.currentOffsetCloseDateType).title;
	    },
	    offsetDateBeginTitle() {
	      const entityTypeName = this.getEntityTypeName();
	      return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_OFFSET_DATE_BEGIN_TITLE_${entityTypeName}`);
	    }
	  },
	  watch: {
	    formData: {
	      handler() {
	        if (!this.isEmitting) {
	          void this.$nextTick(() => {
	            this.emitChange();
	          });
	        }
	      },
	      deep: true
	    },
	    isShowOffsetBeginDate: {
	      handler() {
	        if (!this.isEmitting) {
	          void this.$nextTick(() => {
	            this.emitChange();
	          });
	        }
	      }
	    },
	    dateStart: {
	      handler(newValue) {
	        const roundedCurrent = Math.round(this.formData.currentDateStart);
	        const roundedNew = Math.round(newValue);
	        if (roundedCurrent !== roundedNew) {
	          this.formData.currentDateStart = newValue;
	        }
	      }
	    },
	    offsetBeginDateValue: {
	      handler(newValue) {
	        this.isShowOffsetBeginDate = newValue > 0;
	      }
	    }
	  },
	  created() {
	    this.datePicker = createDatePickerInstance(this.dateStart * 1000, event => {
	      this.formData.currentDateStart = event.getTarget().getSelectedDate().getTime() / 1000;
	    });
	  },
	  beforeUnmount() {
	    this.datePicker.destroy();
	  },
	  methods: {
	    showDateStartCalendar() {
	      if (!this.isEditableDateStartField) {
	        return;
	      }
	      this.datePicker.setTargetNode(this.$refs.dateStart);
	      this.datePicker.show();
	    },
	    showPeriodSelector(target, name) {
	      const menu = [];
	      Object.values(getPeriods()).forEach(item => {
	        menu.push({
	          text: item.title,
	          value: item.value,
	          onclick: this.onSelectPeriodItem.bind(this, name)
	        });
	      });
	      const id = `crm-recurring-dates-section-selector-${name}`;
	      showPopupMenu(id, target, menu);
	    },
	    onSelectPeriodItem(name, _, item) {
	      const value = item.value;
	      if (name === 'beginDate') {
	        this.formData.currentOffsetBeginDateType = value;
	      } else if (name === 'closeDate') {
	        this.formData.currentOffsetCloseDateType = value;
	      }
	      item.getMenuWindow().close();
	    },
	    emitChange() {
	      if (this.isEmitting) {
	        return;
	      }
	      this.isEmitting = true;
	      this.$emit('onChange', {
	        dateStart: this.formData.currentDateStart,
	        offsetBeginDateValue: this.formData.currentOffsetBeginDateValue,
	        offsetBeginDateType: this.formData.currentOffsetBeginDateType,
	        offsetCloseDateValue: this.formData.currentOffsetCloseDateValue,
	        offsetCloseDateType: this.formData.currentOffsetCloseDateType,
	        isShowOffsetBeginDate: this.isShowOffsetBeginDate
	      });
	      void this.$nextTick(() => {
	        this.isEmitting = false;
	      });
	    },
	    getEntityTypeName() {
	      return resolveEntityTypeName(this.entityTypeId);
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" />
			
			<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input crm-entity-widget-content-block-recurring-inside-section-container">
				<FieldTitle :title="startDateTitle" />
				
				<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-datetime ui-ctl-w50">
						<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
						<input
							ref="dateStart"
							:readonly="!isEditableDateStartField"
							:disabled="!isEditableDateStartField"
							class="ui-ctl-element"
							type="text"
							:value="formattedStartDate"
							@click="showDateStartCalendar"
						>
					</div>
				</div>	
				
				<label class="ui-ctl ui-ctl-w100 ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						v-model="isShowOffsetBeginDate"
						value="Y"
					>
					<span class="ui-ctl-label-text">{{offsetDateBeginTitle}}</span>
				</label>

				<FieldTitle v-if="isShowOffsetBeginDate" :title="beginDateTitle" />
				
				<div
					v-if="isShowOffsetBeginDate"
					class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input"
				>
					<div class="crm-entity-widget-content-block-input-wrapper">
						<input
							class="crm-entity-widget-content-input"
							type="number"
							v-model="formData.currentOffsetBeginDateValue"
						>
						<div class="crm-entity-widget-content-block-select">
							<div
								class="crm-entity-widget-content-select"
								@click="(event) => showPeriodSelector(event.target, 'beginDate')"
							>{{offsetBeginDateTypeTitle}}</div>
						</div>
					</div>
				</div>
				
				<FieldTitle :title="closeDateTitle" />
				
				<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
					<div class="crm-entity-widget-content-block-input-wrapper">
						<input
							class="crm-entity-widget-content-input"
							type="number"
							v-model="formData.currentOffsetCloseDateValue"
						>
						<div class="crm-entity-widget-content-block-select">
							<div
								class="crm-entity-widget-content-select"
								@click="(event) => showPeriodSelector(event.target, 'closeDate')"
							>{{offsetCloseDateTypeTitle}}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ModeSelector = {
	  components: {
	    FieldTitle
	  },
	  mixins: [popupMenuMixin('crm-recurring-mode-selector')],
	  props: {
	    entityTypeId: {
	      type: Number,
	      required: true
	    },
	    mode: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    modeTitle() {
	      const entityTypeName = resolveEntityTypeName(this.entityTypeId);
	      return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_MODE_TITLE_${entityTypeName}`);
	    },
	    currentModeTitle() {
	      return getModeByValue(this.mode).title;
	    }
	  },
	  methods: {
	    showModeSelector() {
	      const menu = [];
	      Object.values(modeItems).forEach(({
	        value,
	        title
	      }) => {
	        menu.push({
	          value,
	          text: title,
	          onclick: this.onChangeMode.bind(this)
	        });
	      });
	      showPopupMenu(this.popupMenuId, this.$refs.modeSelector, menu);
	    },
	    onChangeMode(_, item) {
	      this.$emit('onChange', item.value);
	      item.getMenuWindow().close();
	    }
	  },
	  // language=Vue
	  template: `
		<div>
			<FieldTitle :title="modeTitle" />
		
			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="modeSelector"
						class="ui-ctl-element"
						@click="showModeSelector"
					>
						{{currentModeTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MultipleLimitSelector = {
	  components: {
	    FieldTitle
	  },
	  mixins: [popupMenuMixin('crm-recurring-multiple-limit-selector')],
	  props: {
	    entityTypeId: {
	      type: Number,
	      required: true
	    },
	    type: {
	      type: String,
	      required: true
	    },
	    date: {
	      type: Number,
	      required: true
	    },
	    times: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      currentType: this.type,
	      currentDate: this.date,
	      currentTimes: this.times
	    };
	  },
	  computed: {
	    title() {
	      const entityTypeName = resolveEntityTypeName(this.entityTypeId);
	      return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_MULTIPLE_LIMIT_TITLE_${entityTypeName}`);
	    },
	    dateTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_DATE_FIELD_TITLE');
	    },
	    timesTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_TIMES_FIELD_TITLE');
	    },
	    currentMultipleLimitTitle() {
	      return getMultipleLimitByValue(this.currentType).title;
	    },
	    formattedDate() {
	      return getFormattedDate(this.currentDate);
	    },
	    isDateLimit() {
	      return this.currentType === multipleLimits.date.value;
	    },
	    isTimesLimit() {
	      return this.currentType === multipleLimits.times.value;
	    }
	  },
	  watch: {
	    currentType() {
	      this.emitChange();
	    },
	    currentDate() {
	      this.emitChange();
	    },
	    currentTimes() {
	      this.emitChange();
	    }
	  },
	  created() {
	    this.datePicker = createDatePickerInstance(this.date * 1000, event => {
	      this.currentDate = event.getTarget().getSelectedDate().getTime() / 1000;
	    });
	  },
	  beforeUnmount() {
	    this.datePicker.destroy();
	  },
	  methods: {
	    showSelector() {
	      const menu = [];
	      Object.values(multipleLimits).forEach(({
	        value,
	        title
	      }) => {
	        menu.push({
	          value,
	          text: title,
	          onclick: this.onChange.bind(this)
	        });
	      });
	      showPopupMenu(this.popupMenuId, this.$refs.selector, menu);
	    },
	    onChange(_, item) {
	      this.currentType = item.value;
	      item.getMenuWindow().close();
	    },
	    emitChange() {
	      void this.$nextTick(() => {
	        this.$emit('onChange', {
	          type: this.currentType,
	          date: this.currentDate,
	          times: this.currentTimes
	        });
	      });
	    },
	    showDatePicker() {
	      this.datePicker.setTargetNode(this.$refs.date);
	      this.datePicker.show();
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" />
			
			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="selector"
						class="ui-ctl-element"
						@click="showSelector"
					>
						{{currentMultipleLimitTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
			
			<FieldTitle
				v-if="isDateLimit"
				:title="dateTitle"
			/>
			<div
				v-if="isDateLimit"
				class="ui-entity-editor-content-block"
			>
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-datetime ui-ctl-w50">
					<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
					<input
						ref="date"
						class="ui-ctl-element"
						type="text"
						:value="formattedDate"
						@click="showDatePicker"
					>
				</div>
			</div>

			<FieldTitle
				v-if="isTimesLimit"
				:title="timesTitle"
			/>
			<div
				v-if="isTimesLimit"
				class="ui-entity-editor-content-block"
			>
				<div class="ui-ctl ui-ctl-textbox">
					<input
						class="ui-ctl-element"
						type="number"
						min="1"
						v-model="currentTimes"
					>
				</div>
			</div>

		</div>
	`
	};

	// @vue/component
	const MultipleRepeatSelector = {
	  components: {
	    FieldTitle
	  },
	  mixins: [popupMenuMixin('crm-recurring-multiple-repeat-selector')],
	  props: {
	    interval: {
	      type: Number,
	      required: true
	    },
	    type: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      currentInterval: this.interval,
	      currentType: this.type
	    };
	  },
	  computed: {
	    title() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_CUSTOM_TITLE');
	    },
	    currentItemTitle() {
	      return getPeriodByValue(this.currentType).title;
	    }
	  },
	  watch: {
	    currentType() {
	      this.emitChange();
	    },
	    currentInterval() {
	      this.emitChange();
	    }
	  },
	  methods: {
	    showSelector() {
	      const menu = [];
	      Object.values(getPeriods(true)).forEach(({
	        value,
	        title
	      }) => {
	        menu.push({
	          value,
	          text: title,
	          onclick: this.onChange.bind(this)
	        });
	      });
	      showPopupMenu(this.popupMenuId, this.$refs.selector, menu);
	    },
	    onChange(_, item) {
	      this.currentType = item.value;
	      item.getMenuWindow().close();
	    },
	    emitChange() {
	      void this.$nextTick(() => {
	        this.$emit('onChange', {
	          type: this.currentType,
	          value: this.currentInterval
	        });
	      });
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" />
			<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
				<div class="crm-entity-widget-content-block-input-wrapper">
					<input
						class="crm-entity-widget-content-input"
						type="number"
						v-model="currentInterval"
					>
					<div class="crm-entity-widget-content-block-select">
						<div
							ref="selector"
							class="crm-entity-widget-content-select"
							@click="showSelector"
						>{{currentItemTitle}}</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const MultipleTypeSelector = {
	  components: {
	    FieldTitle
	  },
	  props: {
	    type: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      currentType: this.type
	    };
	  },
	  computed: {
	    title() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_TITLE');
	    },
	    currentMultipleTypeTitle() {
	      return getMultipleTypeByValue(this.currentType).title;
	    }
	  },
	  watch: {
	    currentType() {
	      this.emitChange();
	    }
	  },
	  methods: {
	    showSelector() {
	      const menu = [];
	      Object.values(multipleTypes).forEach(({
	        value,
	        title
	      }) => {
	        menu.push({
	          value,
	          text: title,
	          onclick: this.onChange.bind(this)
	        });
	      });
	      const target = this.$refs.selector;
	      const id = 'crm-recurring-multiple-type-selector';
	      showPopupMenu(id, target, menu);
	    },
	    onChange(_, item) {
	      this.currentType = item.value;
	      item.getMenuWindow().close();
	    },
	    emitChange() {
	      void this.$nextTick(() => {
	        this.$emit('onChange', {
	          type: this.currentType
	        });
	      });
	    }
	  },
	  // language=Vue
	  template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title"/>

			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="selector"
						class="ui-ctl-element"
						@click="showSelector"
					>
						{{currentMultipleTypeTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SingleFields = {
	  components: {
	    FieldTitle,
	    HiddenInput
	  },
	  mixins: [popupMenuMixin('crm-recurring-period-selector')],
	  props: {
	    interval: {
	      type: Number,
	      required: true
	    },
	    type: {
	      type: Number,
	      required: true
	    },
	    date: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      currentInterval: this.interval,
	      currentType: this.type,
	      currentDate: this.date
	    };
	  },
	  computed: {
	    prefixTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PREFIX');
	    },
	    datePrefixTitle() {
	      return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_DATE_PREFIX');
	    },
	    currentModeTitle() {
	      return getPeriodByValue(this.type).titleGenitive;
	    },
	    formattedDate() {
	      return getFormattedDate(this.currentDate);
	    }
	  },
	  watch: {
	    currentInterval() {
	      this.emitChange();
	    },
	    currentType() {
	      this.emitChange();
	    },
	    currentDate() {
	      this.emitChange();
	    }
	  },
	  created() {
	    this.datePicker = createDatePickerInstance(this.date * 1000, event => {
	      this.currentDate = event.getTarget().getSelectedDate().getTime() / 1000;
	    });
	  },
	  beforeUnmount() {
	    this.datePicker.destroy();
	  },
	  methods: {
	    emitChange() {
	      void this.$nextTick(() => {
	        this.$emit('onChange', {
	          value: this.currentInterval,
	          type: this.currentType,
	          date: this.currentDate
	        });
	      });
	    },
	    showPeriodSelector() {
	      const menu = [];
	      Object.values(getPeriods()).forEach(({
	        value,
	        titleGenitive
	      }) => {
	        menu.push({
	          value,
	          text: titleGenitive,
	          onclick: this.onChangePeriod.bind(this)
	        });
	      });
	      showPopupMenu(this.popupMenuId, this.$refs.periodSelector, menu);
	    },
	    onChangePeriod(_, item) {
	      this.currentType = item.value;
	      item.getMenuWindow().close();
	    },
	    showDatePicker() {
	      this.datePicker.setTargetNode(this.$refs.date);
	      this.datePicker.show();
	    }
	  },
	  // language=Vue
	  template: `
		<div class="crm-entity-widget-content-block-field-recurring-single">
			<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
				<div class="crm-entity-widget-content-block-input-wrapper">
					<span>{{prefixTitle}} </span>
					<input
						class="crm-entity-widget-content-input"
						type="number"
						v-model="currentInterval"
					>
					
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
						<div
							ref="periodSelector"
							class="ui-ctl-element"
							@click="showPeriodSelector"
						>
							{{currentModeTitle}}
						</div>
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					</div>
					
					<span> {{datePrefixTitle}} </span>
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-datetime ui-ctl-w50">
						<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
						<input 
							ref="date"
							class="ui-ctl-element"
							type="text"
							:value="formattedDate"
							@click="showDatePicker"
						>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const Recurring = {
	  components: {
	    FieldTitle,
	    HiddenInput,
	    ModeSelector,
	    SingleFields,
	    DateFields,
	    EmailFields,
	    MultipleLimitSelector,
	    MultipleRepeatSelector,
	    MultipleTypeSelector,
	    CategorySelector
	  },
	  props: {
	    entityId: {
	      type: Number,
	      required: true
	    },
	    entityTypeId: {
	      type: Number,
	      required: true
	    },
	    data: {
	      type: Object,
	      required: true
	    },
	    params: {
	      type: Object,
	      required: true
	    },
	    changeCallback: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    var _this$data$RECURRING, _this$data$RECURRING2, _this$data$RECURRING3, _this$data$RECURRING4, _this$data$RECURRING5, _this$data$RECURRING6, _this$data$RECURRING7, _this$data$RECURRING8, _this$data$RECURRING9, _this$data$RECURRING10, _this$data$RECURRING11, _this$data$RECURRING12, _this$data$RECURRING13, _this$data$RECURRING14;
	    const dateStart = new Date();
	    const defaultOffsetType = this.getDefaultOffsetType();
	    const offsetBeginDateValue = Number((_this$data$RECURRING = this.data['RECURRING[OFFSET_BEGINDATE_VALUE]']) != null ? _this$data$RECURRING : 0);
	    const offsetCloseDateValue = Number((_this$data$RECURRING2 = this.data['RECURRING[OFFSET_CLOSEDATE_VALUE]']) != null ? _this$data$RECURRING2 : 0);
	    return {
	      mode: (_this$data$RECURRING3 = this.data['RECURRING[MODE]']) != null ? _this$data$RECURRING3 : modeItems.none.value,
	      singleInterval: Number((_this$data$RECURRING4 = this.data['RECURRING[SINGLE_INTERVAL_VALUE]']) != null ? _this$data$RECURRING4 : 0),
	      singleType: Number((_this$data$RECURRING5 = this.data['RECURRING[SINGLE_TYPE]']) != null ? _this$data$RECURRING5 : defaultOffsetType),
	      singleDateBefore: this.initDateInSeconds('RECURRING[SINGLE_DATE_BEFORE]'),
	      multipleCustomIntervalValue: Number((_this$data$RECURRING6 = this.data['RECURRING[MULTIPLE_CUSTOM_INTERVAL_VALUE]']) != null ? _this$data$RECURRING6 : 0),
	      multipleCustomType: Number((_this$data$RECURRING7 = this.data['RECURRING[MULTIPLE_CUSTOM_TYPE]']) != null ? _this$data$RECURRING7 : multipleTypes.day.value),
	      multipleDateStart: this.initDateInSeconds('RECURRING[MULTIPLE_DATE_START]'),
	      multipleTypeLimit: (_this$data$RECURRING8 = this.data['RECURRING[MULTIPLE_TYPE_LIMIT]']) != null ? _this$data$RECURRING8 : multipleLimits.no.value,
	      multipleDateLimit: this.initDateInSeconds('RECURRING[MULTIPLE_DATE_LIMIT]'),
	      multipleTimesLimit: Number((_this$data$RECURRING9 = this.data['RECURRING[MULTIPLE_TIMES_LIMIT]']) != null ? _this$data$RECURRING9 : 1),
	      dateStart,
	      offsetBeginDateType: Number((_this$data$RECURRING10 = this.data['RECURRING[OFFSET_BEGINDATE_TYPE]']) != null ? _this$data$RECURRING10 : defaultOffsetType),
	      offsetBeginDateValue,
	      offsetCloseDateType: Number((_this$data$RECURRING11 = this.data['RECURRING[OFFSET_CLOSEDATE_TYPE]']) != null ? _this$data$RECURRING11 : defaultOffsetType),
	      offsetCloseDateValue,
	      isShowOffsetBeginDate: false,
	      multipleType: Number((_this$data$RECURRING12 = this.data['RECURRING[MULTIPLE_TYPE]']) != null ? _this$data$RECURRING12 : multipleTypes.day.value),
	      multipleLimit: (_this$data$RECURRING13 = this.data['RECURRING[MULTIPLE_TYPE_LIMIT]']) != null ? _this$data$RECURRING13 : multipleLimits.no.value,
	      categoryId: Number((_this$data$RECURRING14 = this.data['RECURRING[CATEGORY_ID]']) != null ? _this$data$RECURRING14 : 0)
	    };
	  },
	  computed: {
	    isMultipleMode() {
	      return this.mode === modeItems.multiple.value;
	    },
	    isSingleMode() {
	      return this.mode === modeItems.single.value;
	    },
	    mustShowMultipleRepeatSelector() {
	      return this.isMultipleMode && this.multipleType === multipleTypes.custom.value;
	    },
	    formattedMultipleDateLimit() {
	      return getFormattedDate(this.multipleDateLimit);
	    },
	    formattedDateStart() {
	      return getFormattedDate(this.multipleDateStart);
	    },
	    formattedSingleDateBefore() {
	      return getFormattedDate(this.singleDateBefore);
	    },
	    dateForDateFieldsComponent() {
	      if (this.mode === modeItems.multiple.value) {
	        return this.multipleDateStart;
	      }
	      let date = new Date(this.singleDateBefore * 1000);
	      switch (this.singleType) {
	        case periods.day.value:
	          date = date.setDate(date.getDate() - this.singleInterval);
	          break;
	        case periods.week.value:
	          date = date.setDate(date.getDate() - this.singleInterval * 7);
	          break;
	        case periods.month.value:
	          date = date.setMonth(date.getMonth() - this.singleInterval);
	          break;
	        default:
	      }
	      return date / 1000;
	    },
	    emailData() {
	      var _this$data$RECURRING15, _this$data$RECURRING16, _this$data$RECURRING17, _this$data$RECURRING18, _this$data$RECURRING19;
	      return {
	        senderId: (_this$data$RECURRING15 = this.data['RECURRING[SENDER_ID]']) != null ? _this$data$RECURRING15 : null,
	        documentId: (_this$data$RECURRING16 = this.data['RECURRING[EMAIL_DOCUMENT_ID]']) != null ? _this$data$RECURRING16 : null,
	        templateId: (_this$data$RECURRING17 = this.data['RECURRING[EMAIL_TEMPLATE_ID]']) != null ? _this$data$RECURRING17 : null,
	        isEnabled: (_this$data$RECURRING18 = this.data['RECURRING[IS_SEND_EMAIL]']) != null ? _this$data$RECURRING18 : false,
	        emailIds: (_this$data$RECURRING19 = this.data['RECURRING[EMAIL_IDS]']) != null ? _this$data$RECURRING19 : []
	      };
	    },
	    isCategoriesEnabled() {
	      var _this$params$isCatego;
	      return (_this$params$isCatego = this.params.isCategoriesEnabled) != null ? _this$params$isCatego : false;
	    },
	    isEmailEnabled() {
	      return this.entityTypeId === BX.CrmEntityType.enumeration.smartinvoice;
	    },
	    beginDateType() {
	      const isCalculated = this.isShowOffsetBeginDate && this.offsetBeginDateValue > 0;
	      return isCalculated ? offsetDateTypes.calculated : offsetDateTypes.set;
	    },
	    closeDateType() {
	      return this.offsetCloseDateValue > 0 ? offsetDateTypes.calculated : offsetDateTypes.set;
	    }
	  },
	  methods: {
	    initDateInSeconds(fieldName) {
	      const fromData = this.data[fieldName];
	      const dateObject = main_date.DateTimeFormat.parse(fromData);
	      const value = (dateObject != null ? dateObject : new Date()).getTime();
	      return value / 1000;
	    },
	    setMode(mode) {
	      this.mode = mode;
	    },
	    setMultipleTypeData({
	      type
	    }) {
	      this.multipleType = type;
	    },
	    setMultipleRepeatData({
	      type,
	      value
	    }) {
	      this.multipleCustomType = type;
	      this.multipleCustomIntervalValue = value;
	    },
	    setMultipleLimits({
	      type,
	      date,
	      times
	    }) {
	      this.multipleTypeLimit = type;
	      this.multipleDateLimit = date;
	      this.multipleTimesLimit = times;
	    },
	    setSingleFields({
	      value,
	      type,
	      date
	    }) {
	      this.singleInterval = value;
	      this.singleType = type;
	      this.singleDateBefore = date;
	    },
	    // eslint-disable-next-line max-len
	    setDateFields({
	      dateStart,
	      offsetBeginDateValue,
	      offsetBeginDateType,
	      offsetCloseDateValue,
	      offsetCloseDateType,
	      isShowOffsetBeginDate
	    }) {
	      if (this.mode === modeItems.multiple.value) {
	        this.multipleDateStart = dateStart;
	      } else {
	        this.dateStart = new Date(dateStart * 1000);
	      }
	      this.offsetBeginDateValue = offsetBeginDateValue;
	      this.offsetBeginDateType = offsetBeginDateType;
	      this.offsetCloseDateValue = offsetCloseDateValue;
	      this.offsetCloseDateType = offsetCloseDateType;
	      this.isShowOffsetBeginDate = isShowOffsetBeginDate;
	    },
	    setCategoryId(categoryId) {
	      this.categoryId = categoryId;
	    },
	    getDefaultOffsetType() {
	      return periods.day.value;
	    }
	  },
	  // language=Vue
	  template: `
		<div>
			<ModeSelector 
				:entity-type-id="entityTypeId"
				:mode="mode"
				@onChange="setMode"
			/>

			<!-- region mode -->
				<HiddenInput :value="mode" name="RECURRING[MODE]" :change-callback="changeCallback" />
			<!-- endregion -->
		
			<div v-if="isMultipleMode || isSingleMode">
				<SingleFields
					v-if="isSingleMode"
					:interval="singleInterval"
					:type="singleType"
					:date="singleDateBefore"
					@onChange="setSingleFields"
				/>

				<MultipleTypeSelector
					v-if="isMultipleMode"
					:type="multipleType"
					@onChange="setMultipleTypeData"
				/>
				
				<MultipleRepeatSelector
					v-if="mustShowMultipleRepeatSelector"
					:interval="multipleCustomIntervalValue"
					:type="multipleCustomType"
					@onChange="setMultipleRepeatData"
				/>
			
				<MultipleLimitSelector
					v-if="isMultipleMode"
					:entity-type-id="entityTypeId"
					:type="multipleTypeLimit"
					:date="multipleDateLimit"
					:times="multipleTimesLimit"
					@onChange="setMultipleLimits"
				/>
			
				<DateFields
					:entity-type-id="entityTypeId"
					:isEditableDateStartField="isMultipleMode"
					:dateStart="dateForDateFieldsComponent"
					:offsetBeginDateValue="offsetBeginDateValue"
					:offsetBeginDateType="offsetBeginDateType"
					:offsetCloseDateValue="offsetCloseDateValue"
					:offsetCloseDateType="offsetCloseDateType"
					@onChange="setDateFields"
				/>
				
				<CategorySelector
					v-if="isCategoriesEnabled"
					:categories="params.categories"
					:categoryId="categoryId"
					@onChange="setCategoryId"
				/>
				
				<EmailFields
					v-if="isEmailEnabled"
					:entity-id="entityId"
					:entity-type-id="entityTypeId"
					:data="emailData"
					:change-callback="changeCallback"
				/>

				<!-- region multiple type -->
				<HiddenInput :value="multipleType" name="RECURRING[MULTIPLE_TYPE]" :change-callback="changeCallback" />
				<!-- endregion -->
				
				<!-- region MultipleRepeatSelector fields -->
				<HiddenInput :value="multipleCustomIntervalValue" name="RECURRING[MULTIPLE_CUSTOM_INTERVAL_VALUE]" :change-callback="changeCallback" />
				<HiddenInput :value="multipleCustomType" name="RECURRING[MULTIPLE_CUSTOM_TYPE]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region MultipleLimitSelector fields -->
				<HiddenInput :value="multipleTypeLimit" name="RECURRING[MULTIPLE_TYPE_LIMIT]" :change-callback="changeCallback" />
				<HiddenInput :value="formattedMultipleDateLimit" name="RECURRING[MULTIPLE_DATE_LIMIT]" :change-callback="changeCallback" />
				<HiddenInput :value="multipleTimesLimit" name="RECURRING[MULTIPLE_TIMES_LIMIT]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region Date fields -->
				<HiddenInput :value="formattedDateStart" name="RECURRING[MULTIPLE_DATE_START]" :change-callback="changeCallback" />
				<HiddenInput :value="beginDateType" name="RECURRING[BEGINDATE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput :value="closeDateType" name="RECURRING[CLOSEDATE_TYPE]" />
				<HiddenInput v-if="isShowOffsetBeginDate" :value="offsetBeginDateValue" name="RECURRING[OFFSET_BEGINDATE_VALUE]" :change-callback="changeCallback" />
				<HiddenInput v-else value="" name="RECURRING[OFFSET_BEGINDATE_VALUE]" :change-callback="changeCallback" />
				<HiddenInput v-if="isShowOffsetBeginDate" :value="offsetBeginDateType" name="RECURRING[OFFSET_BEGINDATE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput v-else value="" name="RECURRING[OFFSET_BEGINDATE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput :value="offsetCloseDateValue" name="RECURRING[OFFSET_CLOSEDATE_VALUE]" :change-callback="changeCallback" />
				<HiddenInput :value="offsetCloseDateType" name="RECURRING[OFFSET_CLOSEDATE_TYPE]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region Single fields -->
				<HiddenInput :value="singleType" name="RECURRING[SINGLE_TYPE]" :change-callback="changeCallback" />
				<HiddenInput :value="singleInterval" name="RECURRING[SINGLE_INTERVAL_VALUE]" :change-callback="changeCallback" />
				<HiddenInput :value="formattedSingleDateBefore" name="RECURRING[SINGLE_DATE_BEFORE]" :change-callback="changeCallback" />
				<!-- endregion -->

				<!-- region Other fields -->
				<HiddenInput v-if="isCategoriesEnabled" :value="categoryId" name="RECURRING[CATEGORY_ID]" :change-callback="changeCallback" />
				<!-- endregion -->
			</div>
		</div>
	`
	};

	let _$4 = t => t,
	  _t$4;
	var _entityTypeId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityTypeId");
	var _entityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _data = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("data");
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _changeCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("changeCallback");
	var _layoutComponent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("layoutComponent");
	var _app = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("app");
	class Recurring$1 {
	  static create(entityTypeId, entityId, changeCallback, params = {}) {
	    return new Recurring$1(entityTypeId, entityId, changeCallback, params);
	  }
	  constructor(entityTypeId, entityId, changeCallback, params = {}) {
	    Object.defineProperty(this, _entityTypeId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _entityId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _data, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _changeCallback, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _layoutComponent, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _app, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId)[_entityTypeId] = entityTypeId;
	    babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId] = entityId;
	    babelHelpers.classPrivateFieldLooseBase(this, _changeCallback)[_changeCallback] = changeCallback;
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  setData(data) {
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data] = data;
	  }
	  getLayout() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _app)[_app]) {
	      this.clean();
	    }
	    const props = {
	      entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId)[_entityTypeId],
	      entityId: babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId],
	      data: babelHelpers.classPrivateFieldLooseBase(this, _data)[_data],
	      params: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params],
	      changeCallback: babelHelpers.classPrivateFieldLooseBase(this, _changeCallback)[_changeCallback]
	    };
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app] = ui_vue3.BitrixVue.createApp(Recurring, props);
	    const container = main_core.Tag.render(_t$4 || (_t$4 = _$4`<div></div>`));
	    babelHelpers.classPrivateFieldLooseBase(this, _layoutComponent)[_layoutComponent] = babelHelpers.classPrivateFieldLooseBase(this, _app)[_app].mount(container);
	    return container;
	  }
	  clean() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _app)[_app]) == null ? void 0 : _babelHelpers$classPr.unmount();
	    babelHelpers.classPrivateFieldLooseBase(this, _app)[_app] = null;
	  }
	  focus() {
	    babelHelpers.classPrivateFieldLooseBase(this, _layoutComponent)[_layoutComponent].focus();
	  }
	}

	exports.Recurring = Recurring$1;

}((this.BX.Crm.Field = this.BX.Crm.Field || {}),BX.Vue3,BX.Crm.Timeline,BX.Main,BX.Main,BX.UI.DatePicker,BX.UI,BX.UI.Mail,BX,BX.Event,BX.UI.EntitySelector,BX));
//# sourceMappingURL=recurring.bundle.js.map
