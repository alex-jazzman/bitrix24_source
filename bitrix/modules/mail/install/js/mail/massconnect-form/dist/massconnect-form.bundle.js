/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports,ui_vue3,ui_system_input,ui_system_input_vue,ui_notification,ui_vue3_components_menu,ui_buttons,ui_iconSet_api_vue,mail_settingSelector,ui_vue3_directives_hint,ui_entitySelector,ui_vue3_components_switcher,ui_switcher,main_core,ui_vue3_components_button,ui_vue3_pinia,ui_analytics) {
	'use strict';

	var MailSyncPeriod = Object.freeze({
	  DAY: '1',
	  WEEK: '7',
	  MONTH: '30',
	  TWO_MONTHS: '60',
	  THREE_MONTHS: '90'
	});

	var CrmSyncPeriod = Object.freeze({
	  WEEK: '7',
	  MONTH: '30',
	  ALL_TIME: '-1'
	});

	var CrmCreateAction = Object.freeze({
	  LEAD: 'LEAD',
	  CONTACT: 'CONTACT'
	});

	var CrmSource = Object.freeze({
	  CALL: 'CALL',
	  EMAIL: 'EMAIL',
	  WEB: 'WEB',
	  ADVERTISING: 'ADVERTISING',
	  PARTNER: 'PARTNER',
	  RECOMMENDATION: 'RECOMMENDATION',
	  TRADE_SHOW: 'TRADE_SHOW',
	  WEBFORM: 'WEBFORM',
	  CALLBACK: 'CALLBACK',
	  RC_GENERATOR: 'RC_GENERATOR',
	  STORE: 'STORE',
	  OTHER: 'OTHER',
	  BOOKING: 'BOOKING',
	  REPEAT_SALE: 'REPEAT_SALE'
	});

	var YES_VALUE = 'Y';
	var NO_VALUE = 'N';
	var SERVICE_CONFIG = {
	  serviceType: 'imap',
	  name: 'other'
	};

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	var useWizardStore = ui_vue3_pinia.defineStore('wizard', {
	  state: function state() {
	    return {
	      connectionSettings: {
	        imapServer: '',
	        imapPort: null,
	        imapSsl: true,
	        smtpSettings: {
	          enabled: false,
	          server: '',
	          port: null,
	          ssl: true
	        }
	      },
	      employees: [],
	      addedEmployees: [],
	      mailSettings: {
	        sync: {
	          enabled: true,
	          periodValue: MailSyncPeriod.WEEK
	        }
	      },
	      crmSettings: {
	        enabled: false,
	        sync: {
	          enabled: true,
	          periodValue: CrmSyncPeriod.WEEK
	        },
	        assignKnownClientEmails: true,
	        incoming: {
	          enabled: true,
	          createAction: CrmCreateAction.LEAD
	        },
	        outgoing: {
	          enabled: true,
	          createAction: CrmCreateAction.CONTACT
	        },
	        source: CrmSource.EMAIL,
	        leadCreationAddresses: '',
	        responsibleQueue: []
	      },
	      calendarSettings: {
	        enabled: true,
	        autoAddEvents: true
	      },
	      errorState: {
	        enabled: false,
	        errorCnt: 0
	      },
	      isLoginColumnShown: false,
	      analyticsSource: '',
	      permissions: {
	        allowedLevels: null,
	        canEditCrmIntegration: false
	      }
	    };
	  },
	  actions: {
	    addEmployee: function addEmployee(employeeItem) {
	      if (this.employees.some(function (employee) {
	        return employee.id === employeeItem.id;
	      })) {
	        return;
	      }
	      this.employees.push(employeeItem);
	    },
	    removeEmployeeById: function removeEmployeeById(employeeId) {
	      this.employees = this.employees.filter(function (employee) {
	        return employee.id !== employeeId;
	      });
	    },
	    setEmployees: function setEmployees(employees) {
	      this.employees = employees;
	    },
	    clearEmployees: function clearEmployees() {
	      this.employees = [];
	    },
	    setAddedEmployees: function setAddedEmployees(employees) {
	      this.addedEmployees = employees;
	    },
	    setMailSettings: function setMailSettings(newSettings) {
	      this.mailSettings = newSettings;
	    },
	    setCrmSettings: function setCrmSettings(newSettings) {
	      this.crmSettings = newSettings;
	    },
	    setCalendarSettings: function setCalendarSettings(newSettings) {
	      this.calendarSettings = newSettings;
	    },
	    prepareCrmOptions: function prepareCrmOptions() {
	      if (!this.crmSettings.enabled) {
	        return {
	          enabled: NO_VALUE
	        };
	      }
	      var crmOptions = {
	        enabled: YES_VALUE,
	        config: {}
	      };
	      if (this.crmSettings.sync.enabled) {
	        crmOptions.config.crm_sync_days = parseInt(this.crmSettings.sync.periodValue, 10) || 0;
	      }
	      if (this.crmSettings.assignKnownClientEmails) {
	        crmOptions.config.crm_public = this.crmSettings.assignKnownClientEmails ? YES_VALUE : NO_VALUE;
	      }
	      if (this.crmSettings.incoming.enabled) {
	        crmOptions.config.crm_new_entity_in = this.crmSettings.incoming.createAction;
	      }
	      if (this.crmSettings.outgoing.enabled) {
	        crmOptions.config.crm_new_entity_out = this.crmSettings.outgoing.createAction;
	      }
	      crmOptions.config.crm_lead_source = this.crmSettings.source;
	      if (this.crmSettings.responsibleQueue.length > 0) {
	        crmOptions.config.crm_lead_resp = this.crmSettings.responsibleQueue.map(function (item) {
	          return item.id;
	        });
	      }
	      if (this.crmSettings.leadCreationAddresses.length > 0) {
	        crmOptions.config.crm_new_lead_for = this.crmSettings.leadCreationAddresses;
	      }
	      return crmOptions;
	    },
	    prepareDataForBackend: function prepareDataForBackend() {
	      var _this = this;
	      var crmOptions = this.prepareCrmOptions();
	      var mailboxes = this.employees.map(function (employee) {
	        var smtpServer = _this.connectionSettings.smtpSettings.server;
	        var smtpPort = _this.connectionSettings.smtpSettings.port;
	        var isSmtpDataFilled = Boolean(smtpServer && smtpPort);
	        var useSmtp = _this.connectionSettings.smtpSettings.enabled && isSmtpDataFilled ? YES_VALUE : NO_VALUE;
	        var mailboxData = {
	          userIdToConnect: employee.id,
	          email: employee.email,
	          login: employee.login || employee.email,
	          password: employee.password,
	          loginSmtp: employee.login || employee.email,
	          passwordSMTP: employee.password,
	          mailboxName: employee.email,
	          senderName: employee.name,
	          server: _this.connectionSettings.imapServer,
	          port: _this.connectionSettings.imapPort,
	          ssl: _this.connectionSettings.imapSsl ? YES_VALUE : NO_VALUE,
	          useSmtp: useSmtp,
	          serverSmtp: _this.connectionSettings.smtpSettings.server,
	          portSmtp: _this.connectionSettings.smtpSettings.port,
	          sslSmtp: _this.connectionSettings.smtpSettings.ssl ? YES_VALUE : NO_VALUE,
	          iCalAccess: _this.calendarSettings.enabled && _this.calendarSettings.autoAddEvents ? YES_VALUE : NO_VALUE,
	          serviceConfig: SERVICE_CONFIG,
	          syncAfterConnection: NO_VALUE,
	          messageMaxAge: parseInt(_this.mailSettings.sync.periodValue, 10)
	        };
	        return _objectSpread(_objectSpread({}, mailboxData), {}, {
	          crmOptions: _objectSpread({}, crmOptions)
	        });
	      });
	      return {
	        mailboxes: mailboxes
	      };
	    },
	    enableErrorState: function enableErrorState(errorCnt) {
	      this.errorState = {
	        enabled: true,
	        errorCnt: errorCnt
	      };
	    },
	    toggleLoginColumn: function toggleLoginColumn() {
	      this.isLoginColumnShown = !this.isLoginColumnShown;
	      if (!this.isLoginColumnShown) {
	        this.employees = this.employees.map(function (employee) {
	          return _objectSpread(_objectSpread({}, employee), {}, {
	            login: ''
	          });
	        });
	      }
	    },
	    setAnalyticsSource: function setAnalyticsSource(source) {
	      this.analyticsSource = source;
	    },
	    setSmtpStatus: function setSmtpStatus(isAvailable) {
	      this.connectionSettings.smtpSettings.enabled = isAvailable;
	    },
	    prepareDataForHistory: function prepareDataForHistory() {
	      return {
	        connectionSettings: this.connectionSettings,
	        mailSettings: this.mailSettings,
	        crmSettings: this.crmSettings,
	        calendarSettings: this.calendarSettings,
	        employees: this.employees.map(function (employee) {
	          return _objectSpread(_objectSpread({}, employee), {}, {
	            password: ''
	          });
	        })
	      };
	    },
	    setPermissions: function setPermissions(permissions) {
	      this.permissions.allowedLevels = [permissions === null || permissions === void 0 ? void 0 : permissions.allowedLevels];
	      this.permissions.canEditCrmIntegration = permissions === null || permissions === void 0 ? void 0 : permissions.canEditCrmIntegration;
	    }
	  }
	});

	// @vue/component
	var WizardProgressBar = {
	  props: {
	    totalSteps: {
	      type: Number,
	      required: true
	    },
	    currentStepIndex: {
	      type: Number,
	      required: true
	    }
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__wizard_progress-bar\">\n\t\t\t<div\n\t\t\t\tv-for=\"(step, index) in totalSteps\"\n\t\t\t\t:key=\"index\"\n\t\t\t\tclass=\"mail_massconnect__wizard_progress-bar__item\"\n\t\t\t\t:data-test-id=\"'mail_massconnect__wizard_progress-bar__item' + index\"\n\t\t\t\t:class=\"{ 'mail_massconnect__wizard_progress-bar__item--active': index <= currentStepIndex }\"\n\t\t\t>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	var LocalizationMixin = {
	  methods: {
	    loc: function loc(phraseCode) {
	      var replacements = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  }
	};

	// @vue/component
	var WizardNavigation = {
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  mixins: [LocalizationMixin],
	  props: {
	    isFirstStep: Boolean,
	    isLastStep: Boolean,
	    isSubmitting: Boolean,
	    prevDisabled: Boolean,
	    disabledContinueButton: {
	      type: Boolean,
	      "default": false
	    }
	  },
	  emits: ['prev-step', 'next-step', 'submit'],
	  data: function data() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle
	    };
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__wizard_navigation\" data-test-id=\"mail_massconnect__wizard_navigation\">\n\t\t\t<UiButton\n\t\t\t\tv-if=\"isLastStep\"\n\t\t\t\tclass=\"mail_massconnect__wizard_navigation_submit-button\"\n\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_CONNECT_BUTTON_TITLE')\"\n\t\t\t\t:style=\"AirButtonStyle.FILLED\"\n\t\t\t\t:waiting=\"isSubmitting\"\n\t\t\t\t@click=\"$emit('submit')\"\n\t\t\t/>\n\t\t\t<UiButton\n\t\t\t\tv-else\n\t\t\t\tclass=\"mail_massconnect__wizard_navigation_next-button\"\n\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_CONTINUTE_BUTTON_TITLE')\"\n\t\t\t\t:style=\"AirButtonStyle.FILLED\"\n\t\t\t\t:disabled=\"disabledContinueButton\"\n\t\t\t\t@click=\"$emit('next-step')\"\n\t\t\t/>\n\t\t\t<UiButton\n\t\t\t\tv-if=\"!isFirstStep && !prevDisabled\"\n\t\t\t\tclass=\"mail_massconnect__wizard_navigation_prev-button\"\n\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_BACK_BUTTON_TITLE')\"\n\t\t\t\t:style=\"AirButtonStyle.PLAIN\"\n\t\t\t\t@click=\"$emit('prev-step')\"\n\t\t\t/>\n\t\t</div>\n\t"
	};

	function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

	// @vue/component
	var ConnectionData = {
	  components: {
	    BInput: ui_system_input_vue.BInput
	  },
	  mixins: [LocalizationMixin],
	  props: {
	    validationAttempted: {
	      type: Boolean,
	      "default": false
	    }
	  },
	  emits: ['update:validity'],
	  disableButtonOnInvalid: false,
	  data: function data() {
	    return {
	      InputSize: ui_system_input.InputSize,
	      InputDesign: ui_system_input.InputDesign
	    };
	  },
	  computed: _objectSpread$1(_objectSpread$1({}, ui_vue3_pinia.mapState(useWizardStore, ['connectionSettings', 'analyticsSource'])), {}, {
	    isValid: function isValid() {
	      var imapValid = Boolean(this.connectionSettings.imapServer && this.connectionSettings.imapPort);
	      if (!this.connectionSettings.smtpSettings.enabled) {
	        return imapValid;
	      }
	      var smtpServer = this.connectionSettings.smtpSettings.server;
	      var smtpPort = this.connectionSettings.smtpSettings.port;
	      var smtpFilled = Boolean(smtpServer || smtpPort);
	      if (!smtpFilled) {
	        return imapValid;
	      }
	      var smtpValid = Boolean(smtpServer && smtpPort);
	      return imapValid && smtpValid;
	    },
	    showErrors: function showErrors() {
	      return this.validationAttempted;
	    },
	    imapServerError: function imapServerError() {
	      return this.showErrors && !this.connectionSettings.imapServer ? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_ERROR') : null;
	    },
	    imapPortError: function imapPortError() {
	      return this.showErrors && !this.connectionSettings.imapPort ? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_ERROR') : null;
	    },
	    smtpServerError: function smtpServerError() {
	      if (!this.showErrors || !this.connectionSettings.smtpSettings.enabled) {
	        return null;
	      }
	      var smtpServer = this.connectionSettings.smtpSettings.server;
	      var smtpPort = this.connectionSettings.smtpSettings.port;
	      if (smtpPort && !smtpServer) {
	        return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_ERROR');
	      }
	      return null;
	    },
	    smtpPortError: function smtpPortError() {
	      if (!this.showErrors || !this.connectionSettings.smtpSettings.enabled) {
	        return null;
	      }
	      var smtpServer = this.connectionSettings.smtpSettings.server;
	      var smtpPort = this.connectionSettings.smtpSettings.port;
	      if (smtpServer && !smtpPort) {
	        return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_ERROR');
	      }
	      return null;
	    }
	  }),
	  watch: {
	    isValid: {
	      handler: function handler(isValid) {
	        this.$emit('update:validity', isValid);
	      },
	      immediate: true
	    }
	  },
	  methods: {
	    onStepComplete: function onStepComplete() {
	      ui_analytics.sendData({
	        tool: 'mail',
	        event: 'mailbox_mass_step1',
	        category: 'mail_mass_ops',
	        c_section: this.analyticsSource
	      });
	    },
	    handleImapPortInput: function handleImapPortInput(port) {
	      this.connectionSettings.imapPort = this.getSanitizedValue(port);
	    },
	    handleSmtpPortInput: function handleSmtpPortInput(port) {
	      this.connectionSettings.smtpSettings.port = this.getSanitizedValue(port);
	    },
	    getSanitizedValue: function getSanitizedValue(value) {
	      return String(value !== null && value !== void 0 ? value : '').replaceAll(/\D/g, '');
	    }
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__connection-data_form\" data-test-id=\"mail_massconnect__connection-data_form\">\n\t\t\t<div class=\"mail_massconnect__section-title_container\">\n\t\t\t\t<span class=\"mail_massconnect__section-title\">\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_CARD_TITLE_MSGVER_1') }}\n\t\t\t\t</span>\n\t\t\t\t<span class=\"mail_massconnect__section-description\">\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_CARD_DESCRIPTION') }}\n\t\t\t\t</span>\n\t\t\t</div>\n\n\t\t\t<div v-if=\"false\" data-test-id=\"mail_massconnect__connection-data_domain-group\">\n\t\t\t\t<BInput\n\t\t\t\t\tclass=\"mail_massconnect__group\"\n\t\t\t\t\t:label=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_DOMAIN_INPUT_LABEL')\"\n\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_DOMAIN_INPUT_PLACEHOLDER')\"\n\t\t\t\t\t:size=\"InputSize.Lg\"\n\t\t\t\t\t:design=\"InputDesign.Grey\"\n\t\t\t\t\tv-model=\"connectionSettings.email\"\n\t\t\t\t/>\n\t\t\t</div>\n\n\t\t\t<div class=\"mail_massconnect__connection-block\">\n\t\t\t\t<div class=\"mail_massconnect__input-group\" data-test-id=\"mail_massconnect__connection-data_imap-group\">\n\t\t\t\t\t<BInput\n\t\t\t\t\t\tclass=\"mail_massconnect__input-group_main\"\n\t\t\t\t\t\t:label=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_LABEL')\"\n\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_PLACEHOLDER')\"\n\t\t\t\t\t\t:size=\"InputSize.Lg\"\n\t\t\t\t\t\t:design=\"InputDesign.DEFAULT\"\n\t\t\t\t\t\tv-model=\"connectionSettings.imapServer\"\n\t\t\t\t\t\t:error=\"imapServerError\"\n\t\t\t\t\t/>\n\t\t\t\t\t<BInput\n\t\t\t\t\t\tclass=\"mail_massconnect__input-group_port\"\n\t\t\t\t\t\t:label=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_LABEL')\"\n\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_PLACEHOLDER')\"\n\t\t\t\t\t\ttype=\"number\"\n\t\t\t\t\t\t:size=\"InputSize.Lg\"\n\t\t\t\t\t\t:design=\"InputDesign.DEFAULT\"\n\t\t\t\t\t\tv-model=\"connectionSettings.imapPort\"\n\t\t\t\t\t\t:error=\"imapPortError\"\n\t\t\t\t\t\t@input=\"handleImapPortInput(connectionSettings.imapPort)\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"mail_massconnect__connection-data_checkbox-group\">\n\t\t\t\t\t<input\n\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\tid=\"mail_massconnect__imap-ssl\"\n\t\t\t\t\t\tclass=\"mail_massconnect__checkbox\"\n\t\t\t\t\t\tv-model=\"connectionSettings.imapSsl\"\n\t\t\t\t\t\tdata-test-id=\"mail_massconnect__connection-data_imap-ssl-checkbox\"\n\t\t\t\t\t/>\n\t\t\t\t\t<label for=\"mail_massconnect__imap-ssl\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_SSL_INPUT_LABEL') }}\n\t\t\t\t\t</label>\n\t\t\t\t</div>\n\t\t\t</div>\n\n\t\t\t<div \n\t\t\t\tv-if=\"connectionSettings.smtpSettings.enabled\"\n\t\t\t\tclass=\"mail_massconnect__connection-block\"\n\t\t\t>\n\t\t\t\t<div class=\"mail_massconnect__input-group\" data-test-id=\"mail_massconnect__connection-data_smtp-group\">\n\t\t\t\t\t<BInput\n\t\t\t\t\t\tclass=\"mail_massconnect__input-group_main\"\n\t\t\t\t\t\t:label=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_LABEL')\"\n\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_PLACEHOLDER')\"\n\t\t\t\t\t\t:size=\"InputSize.Lg\"\n\t\t\t\t\t\t:design=\"InputDesign.DEFAULT\"\n\t\t\t\t\t\tv-model=\"connectionSettings.smtpSettings.server\"\n\t\t\t\t\t\t:error=\"smtpServerError\"\n\t\t\t\t\t/>\n\t\t\t\t\t<BInput\n\t\t\t\t\t\tclass=\"mail_massconnect__input-group_port\"\n\t\t\t\t\t\t:label=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_LABEL')\"\n\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_PLACEHOLDER')\"\n\t\t\t\t\t\ttype=\"number\"\n\t\t\t\t\t\t:size=\"InputSize.Lg\"\n\t\t\t\t\t\t:design=\"InputDesign.DEFAULT\"\n\t\t\t\t\t\tv-model=\"connectionSettings.smtpSettings.port\"\n\t\t\t\t\t\t:error=\"smtpPortError\"\n\t\t\t\t\t\t@input=\"handleSmtpPortInput(connectionSettings.smtpSettings.port)\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"mail_massconnect__connection-data_checkbox-group\">\n\t\t\t\t\t<input\n\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\tid=\"mail_massconnect__smtp-ssl\"\n\t\t\t\t\t\tclass=\"mail_massconnect__checkbox\"\n\t\t\t\t\t\tv-model=\"connectionSettings.smtpSettings.ssl\"\n\t\t\t\t\t\tdata-test-id=\"mail_massconnect__connection-data_smtp-ssl-checkbox\"\n\t\t\t\t\t/>\n\t\t\t\t\t<label for=\"mail_massconnect__smtp-ssl\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_SSL_INPUT_LABEL') }}\n\t\t\t\t\t</label>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	function _regeneratorRuntime() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	var Api = {
	  connectMailbox: function () {
	    var _connectMailbox = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(mailbox, massConnectId) {
	      return _regeneratorRuntime().wrap(function _callee$(_context) {
	        while (1) switch (_context.prev = _context.next) {
	          case 0:
	            return _context.abrupt("return", BX.ajax.runAction('mail.mailboxconnecting.connectMailboxFromMassconnect', {
	              data: {
	                mailbox: mailbox,
	                massConnectId: massConnectId
	              }
	            }));
	          case 1:
	          case "end":
	            return _context.stop();
	        }
	      }, _callee);
	    }));
	    function connectMailbox(_x, _x2) {
	      return _connectMailbox.apply(this, arguments);
	    }
	    return connectMailbox;
	  }(),
	  saveMailboxConnectionData: function () {
	    var _saveMailboxConnectionData = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(massConnectData) {
	      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
	        while (1) switch (_context2.prev = _context2.next) {
	          case 0:
	            return _context2.abrupt("return", BX.ajax.runAction('mail.mailboxconnecting.saveMassConnectData', {
	              data: {
	                massConnectData: massConnectData
	              }
	            }));
	          case 1:
	          case "end":
	            return _context2.stop();
	        }
	      }, _callee2);
	    }));
	    function saveMailboxConnectionData(_x3) {
	      return _saveMailboxConnectionData.apply(this, arguments);
	    }
	    return saveMailboxConnectionData;
	  }(),
	  getDepartmentsUsers: function () {
	    var _getDepartmentsUsers = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(departmentIds) {
	      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
	        while (1) switch (_context3.prev = _context3.next) {
	          case 0:
	            return _context3.abrupt("return", BX.ajax.runAction('mail.mailboxconnecting.getDepartmentUsers', {
	              data: {
	                departmentIds: departmentIds
	              }
	            }));
	          case 1:
	          case "end":
	            return _context3.stop();
	        }
	      }, _callee3);
	    }));
	    function getDepartmentsUsers(_x4) {
	      return _getDepartmentsUsers.apply(this, arguments);
	    }
	    return getDepartmentsUsers;
	  }()
	};

	function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$2(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

	// @vue/component
	var EmployeeListTable = {
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  mixins: [LocalizationMixin],
	  props: {
	    isLoginColumnShown: {
	      type: Boolean,
	      "default": true
	    },
	    /** @type {Employee[]} */
	    employees: {
	      type: Array,
	      required: true
	    },
	    readonlyMode: {
	      type: Boolean,
	      "default": false
	    }
	  },
	  data: function data() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle
	    };
	  },
	  computed: {
	    outline: function outline() {
	      return ui_iconSet_api_vue.Outline;
	    }
	  },
	  methods: _objectSpread$2({}, ui_vue3_pinia.mapActions(useWizardStore, ['removeEmployeeById'])),
	  template: "\n\t\t<div \n\t\t\tclass=\"mail_massconnect__employee-list_table\" \n\t\t\t:class=\"{ '--login-hidden': !isLoginColumnShown }\"\n\t\t\tdata-test-id=\"mail_massconnect__employee-list_table\"\n\t\t>\n\t\t\t<div class=\"mail_massconnect__employee-list_table_header\">\n\t\t\t\t<div class=\"mail_massconnect__employee-list_table_cell --name\">\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_NAME_COLUMN_TITLE') }}\n\t\t\t\t</div>\n\t\t\t\t<div class=\"mail_massconnect__employee-list_table_cell --email\">\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_EMAIL_COLUMN_TITLE') }}\n\t\t\t\t</div>\n\t\t\t\t<div \n\t\t\t\t\tv-if=\"isLoginColumnShown\" \n\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_cell --login\"\n\t\t\t\t\tdata-test-id=\"mail_massconnect__employee-list_table_login-header\"\n\t\t\t\t>\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_LOGIN_COLUMN_TITLE') }}\n\t\t\t\t</div>\n\t\t\t\t<div \n\t\t\t\t\tv-if=\"!readonlyMode\" \n\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_cell --password\"\n\t\t\t\t\tdata-test-id=\"mail_massconnect__employee-list_table_password-header\"\n\t\t\t\t>\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_PASSWORD_COLUMN_TITLE') }}\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div v-for=\"(employee, index) in employees\"\n\t\t\t\t:key=\"employee.id\"\n\t\t\t\tclass=\"mail_massconnect__employee-list_table_row\"\n\t\t\t\t:data-test-id=\"'mail_massconnect__employee-list_table_row-' + index\"\n\t\t\t>\n\t\t\t\t<div class=\"mail_massconnect__employee-list_table_cell --name\">\n\t\t\t\t\t<div class=\"mail_massconnect__employee-list_table_employee-info\">\n\t\t\t\t\t\t<img\n\t\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_employee-avatar\"\n\t\t\t\t\t\t\t:src=\"encodeURI(employee.avatar)\"\n\t\t\t\t\t\t\talt=\"\"\n\t\t\t\t\t\t\t:data-test-id=\"'mail_massconnect__employee-list_table_row-' + index + '_avatar'\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<span \n\t\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_employee-name\"\n\t\t\t\t\t\t\t:data-test-id=\"'mail_massconnect__employee-list_table_row-' + index + '_name'\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t{{ employee.name }}\n\t\t\t\t\t\t</span>\n\t\t\t\t\t\t<div \n\t\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_delete-btn-container\"\n\t\t\t\t\t\t\t:data-test-id=\"'mail_massconnect__employee-list_table_row-' + index + '_delete-btn-container'\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<UiButton\n\t\t\t\t\t\t\t\tv-if=\"!readonlyMode\"\n\t\t\t\t\t\t\t\t:style=\"AirButtonStyle.OUTLINE\"\n\t\t\t\t\t\t\t\t:leftIcon=\"outline.CROSS_M\"\n\t\t\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_delete-employee\"\n\t\t\t\t\t\t\t\t@click=\"removeEmployeeById(employee.id)\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"mail_massconnect__employee-list_table_cell --email\">\n\t\t\t\t\t<input\n\t\t\t\t\t\ttype=\"email\"\n\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_input\"\n\t\t\t\t\t\tv-model=\"employee.email\"\n\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_EMAIL_COLUMN_PLACEHOLDER')\"\n\t\t\t\t\t\t:readonly=\"readonlyMode\"\n\t\t\t\t\t\t:data-test-id=\"'mail_massconnect__employee-list_table_row-' + index + '_email-input'\"\n\t\t\t\t\t\t:name=\"'mail_massconnect__employee-list_table_row-' + index + '_email-input'\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"mail_massconnect__employee-list_table_cell --login\">\n\t\t\t\t\t<input\n\t\t\t\t\t\ttype=\"text\"\n\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_input\"\n\t\t\t\t\t\tv-model=\"employee.login\"\n\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_LOGIN_COLUMN_PLACEHOLDER')\"\n\t\t\t\t\t\t:readonly=\"readonlyMode\"\n\t\t\t\t\t\t:data-test-id=\"'mail_massconnect__employee-list_table_row-' + index + '_login-input'\"\n\t\t\t\t\t\t:name=\"'mail_massconnect__employee-list_table_row-' + index + '_password-input'\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t\t<div v-if=\"!readonlyMode\" class=\"mail_massconnect__employee-list_table_cell --password\">\n\t\t\t\t\t<input\n\t\t\t\t\t\ttype=\"password\"\n\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_table_input\"\n\t\t\t\t\t\tv-model=\"employee.password\"\n\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_PASSWORD_COLUMN_PLACEHOLDER')\"\n\t\t\t\t\t\t:data-test-id=\"'mail_massconnect__employee-list_table_row-' + index + '_password-input'\"\n\t\t\t\t\t\t:name=\"'mail_massconnect__employee-list_table_row-' + index + '_password-input'\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	function _regeneratorRuntime$1() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime$1 = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$3(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

	// @vue/component
	var SelectEmployees = {
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_vue3_components_menu.BMenu,
	    EmployeeListTable: EmployeeListTable
	  },
	  mixins: [LocalizationMixin],
	  emits: ['update:validity'],
	  data: function data() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      actionsMenuActive: false,
	      showAddedEmployees: false
	    };
	  },
	  computed: _objectSpread$3(_objectSpread$3({}, ui_vue3_pinia.mapState(useWizardStore, ['employees', 'errorState', 'addedEmployees', 'isLoginColumnShown', 'analyticsSource', 'permissions'])), {}, {
	    set: function set() {
	      return ui_iconSet_api_vue.Set;
	    },
	    outline: function outline() {
	      return ui_iconSet_api_vue.Outline;
	    },
	    isEmployeeListEmpty: function isEmployeeListEmpty() {
	      return this.employees.length === 0;
	    },
	    isValid: function isValid() {
	      return !this.isEmployeeListEmpty;
	    },
	    menuOptions: function menuOptions() {
	      var _this = this;
	      return {
	        bindElement: this.$refs.actionsMenuActiveRef,
	        items: [{
	          title: this.isLoginColumnShown ? this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_LOGIN_HIDE') : this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_LOGIN_SHOW'),
	          icon: this.isLoginColumnShown ? this.set.CROSSED_EYE_2 : this.set.OPENED_EYE,
	          onClick: function onClick() {
	            _this.toggleLoginColumn();
	          }
	        }, {
	          title: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_DELETE_ALL'),
	          icon: ui_iconSet_api_vue.Outline.TRASHCAN,
	          onClick: function onClick() {
	            _this.actionsMenuActive = false;
	            _this.clearEmployees();
	            _this.employeeDialog.deselectAll();
	          }
	        }]
	      };
	    },
	    isFixingErrorsHintText: function isFixingErrorsHintText() {
	      return main_core.Loc.getMessagePlural('MAIL_MASSCONNECT_FORM_UTILITY_BLOCK_IS_FIXING_ERRORS_HINT', this.errorState.errorCnt, {
	        '#ERROR_CNT#': this.errorState.errorCnt
	      });
	    },
	    helpDescLink: function helpDescLink() {
	      // ToDo: make a link when help article is ready
	      return null;
	    }
	  }),
	  watch: {
	    isValid: {
	      handler: function handler(isValid) {
	        this.$emit('update:validity', isValid);
	      },
	      immediate: true
	    }
	  },
	  created: function created() {
	    this.employeeDialog = this.getEmployeeDialog();
	  },
	  methods: _objectSpread$3(_objectSpread$3({}, ui_vue3_pinia.mapActions(useWizardStore, ['setEmployees', 'toggleLoginColumn', 'addEmployee', 'clearEmployees'])), {}, {
	    onStepComplete: function onStepComplete() {
	      ui_analytics.sendData({
	        tool: 'mail',
	        event: 'mailbox_mass_step2',
	        category: 'mail_mass_ops',
	        c_section: this.analyticsSource
	      });
	    },
	    getEmployeeDialog: function getEmployeeDialog() {
	      var _this2 = this;
	      var applyButton = new ui_buttons.SaveButton({
	        useAirDesign: true,
	        text: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_DIALOG_ADD_BUTTON_TEXT'),
	        onclick: function () {
	          var _onclick = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee(button) {
	            return _regeneratorRuntime$1().wrap(function _callee$(_context) {
	              while (1) switch (_context.prev = _context.next) {
	                case 0:
	                  button.setWaiting(true);
	                  _context.next = 3;
	                  return _this2.handleSaveItems(_this2.employeeDialog.getSelectedItems());
	                case 3:
	                  button.setWaiting(false);
	                case 4:
	                case "end":
	                  return _context.stop();
	              }
	            }, _callee);
	          }));
	          function onclick(_x) {
	            return _onclick.apply(this, arguments);
	          }
	          return onclick;
	        }()
	      });
	      var cancelButton = new ui_buttons.CancelButton({
	        useAirDesign: true,
	        style: ui_vue3_components_button.AirButtonStyle.OUTLINE,
	        onclick: function onclick() {
	          _this2.employeeDialog.hide();
	        }
	      });
	      return new ui_entitySelector.Dialog({
	        width: 420,
	        height: 400,
	        multiple: true,
	        showAvatars: true,
	        enableSearch: true,
	        context: 'MAIL_MASSCONNECT_EMPLOYEES',
	        entities: [{
	          id: 'structure-node',
	          options: {
	            selectMode: 'usersAndDepartments',
	            forSearch: true,
	            allowSelectRootDepartment: true,
	            restricted: 'view',
	            allowedPermissionLevels: this.permissions.allowedLevels
	          }
	        }],
	        events: {
	          onDestroy: function onDestroy() {
	            _this2.employeeDialog = _this2.getEmployeeDialog();
	          }
	        },
	        footer: [applyButton.render(), cancelButton.render()],
	        footerOptions: {
	          containerStyles: {
	            display: 'flex',
	            'justify-content': 'center',
	            gap: '12px',
	            'background-color': 'var(--ui-color-palette-white-base)'
	          }
	        }
	      });
	    },
	    openEmployeeSelector: function openEmployeeSelector() {
	      var targetNode = this.$refs.addButton.button.getContainer();
	      this.employeeDialog.setTargetNode(targetNode);
	      if (!this.employeeDialog.isOpen()) {
	        this.employeeDialog.setPreselectedItems(this.employees.map(function (employee) {
	          return ['user', employee.id];
	        }));
	        this.employeeDialog.show();
	      }
	    },
	    handleSaveItems: function handleSaveItems(items) {
	      var _this3 = this;
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee2() {
	        var selectedUsers, departmentsToCheck, departmentUsers, _rawDepartmentUsers$d, rawDepartmentUsers;
	        return _regeneratorRuntime$1().wrap(function _callee2$(_context2) {
	          while (1) switch (_context2.prev = _context2.next) {
	            case 0:
	              selectedUsers = [];
	              departmentsToCheck = [];
	              items.forEach(function (item) {
	                if (item.entityId === 'user') {
	                  selectedUsers.push({
	                    id: item.getId(),
	                    entityId: 'user',
	                    name: item.getTitle(),
	                    avatar: item.getAvatar(),
	                    email: '',
	                    login: '',
	                    password: ''
	                  });
	                } else if (item.entityId === 'structure-node') {
	                  departmentsToCheck.push(item.id);
	                }
	              });
	              departmentUsers = [];
	              _context2.prev = 4;
	              if (!(departmentsToCheck.length > 0)) {
	                _context2.next = 10;
	                break;
	              }
	              _context2.next = 8;
	              return Api.getDepartmentsUsers(departmentsToCheck);
	            case 8:
	              rawDepartmentUsers = _context2.sent;
	              departmentUsers = (_rawDepartmentUsers$d = rawDepartmentUsers.data) === null || _rawDepartmentUsers$d === void 0 ? void 0 : _rawDepartmentUsers$d.map(function (user) {
	                return {
	                  id: user.id,
	                  entityId: 'user',
	                  name: user.name,
	                  avatar: user.avatar === null || user.avatar === '' ? _this3.employeeDialog.getEntity('user').getItemOption('avatar', 'user') : user.avatar,
	                  email: '',
	                  login: '',
	                  password: ''
	                };
	              });
	            case 10:
	              _context2.next = 16;
	              break;
	            case 12:
	              _context2.prev = 12;
	              _context2.t0 = _context2["catch"](4);
	              ui_notification.UI.Notification.Center.notify({
	                content: _this3.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_SELECTOR_ADD_ERROR')
	              });
	              return _context2.abrupt("return");
	            case 16:
	              [].concat(selectedUsers, babelHelpers.toConsumableArray(departmentUsers)).forEach(function (employee) {
	                return _this3.addEmployee(employee);
	              });
	              _this3.employeeDialog.deselectAll();
	              _this3.employeeDialog.hide();
	            case 19:
	            case "end":
	              return _context2.stop();
	          }
	        }, _callee2, null, [[4, 12]]);
	      }))();
	    }
	  }),
	  template: "\n\t\t<div class=\"mail_massconnect__select-employees_form\">\n\t\t\t<div class=\"mail_massconnect__employee-list_header\">\n\t\t\t\t<div class=\"mail_massconnect__section-title_container\">\n\t\t\t\t\t<span class=\"mail_massconnect__section-title\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_TITLE') }}\n\t\t\t\t\t</span>\n\t\t\t\t\t<span v-if=\"!errorState.enabled\" class=\"mail_massconnect__section-description\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_DESCRIPTION') }}\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t\t<div \n\t\t\t\t\tv-show=\"!errorState.enabled\" \n\t\t\t\t\tclass=\"mail_massconnect__employee-list_header_buttons\"\n\t\t\t\t\tdata-test-id=\"mail_massconnect__employee-list_header_buttons\"\n\t\t\t\t>\n\t\t\t\t\t<UiButton\n\t\t\t\t\t\tref=\"addButton\"\n\t\t\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ADD_BUTTON_TITLE')\"\n\t\t\t\t\t\t:leftIcon=\"set.PLUS_IN_CIRCLE\"\n\t\t\t\t\t\t:style=\"AirButtonStyle.TINTED\"\n\t\t\t\t\t\t@click=\"openEmployeeSelector\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</div>\n\n\t\t\t<div v-show=\"!isEmployeeListEmpty\" class=\"mail_massconnect__employee-list_container\">\n\t\t\t\t<div \n\t\t\t\t\tv-if=\"errorState.enabled\" \n\t\t\t\t\tclass=\"mail_massconnect__fixing-errors-hint_container\"\n\t\t\t\t\tdata-test-id=\"mail_massconnect__fixing-errors-hint_container\"\n\t\t\t\t>\n\t\t\t\t\t<div class=\"mail_massconnect__fixing-errors-hint_image\"/>\n\t\t\t\t\t<div class=\"mail_massconnect__fixing-errors-hint_text\">\n\t\t\t\t\t\t{{ isFixingErrorsHintText }}\n\t\t\t\t\t</div>\n\t\t\t\t\t<div v-if=\"helpDescLink\" class=\"mail_massconnect__fixing-errors-hint_link\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_UTILITY_BLOCK_IS_FIXING_ERRORS_LINK') }}\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div \n\t\t\t\t\tv-else \n\t\t\t\t\tclass=\"mail_massconnect__utility-block_container\"\n\t\t\t\t\tdata-test-id=\"mail_massconnect__utility-block_container\"\n\t\t\t\t>\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"mail_massconnect__employee-list_info_actions\"\n\t\t\t\t\t\t@click=\"actionsMenuActive = true\"\n\t\t\t\t\t\tref=\"actionsMenuActiveRef\"\n\t\t\t\t\t>\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_TITLE') }}\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"mail_massconnect__employee-list_info_actions-icon\">\n\t\t\t\t\t\t<BIcon :name=\"outline.CHEVRON_DOWN_L\"\n\t\t\t\t\t\t\t@click=\"actionsMenuActive = true\"\n\t\t\t\t\t\t\t:size=\"18\"\n\t\t\t\t\t\t\tcolor=\"var(--ui-color-palette-gray-50)\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t</BIcon>\n\t\t\t\t\t</div>\n\t\t\t\t\t<BMenu v-if=\"actionsMenuActive\" :options=\"menuOptions\" @close=\"actionsMenuActive = false\"/>\n\t\t\t\t</div>\n\t\t\t\t<EmployeeListTable\n\t\t\t\t\t:isLoginColumnShown=\"isLoginColumnShown\"\n\t\t\t\t\t:employees=\"employees\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tv-if=\"addedEmployees.length > 0\" \n\t\t\t\tclass=\"mail_massconnect__employee-list_added-employees_container\"\n\t\t\t\tdata-test-id=\"mail_massconnect__employee-list_added-employees_container\"\n\t\t\t>\n\t\t\t\t<div\n\t\t\t\t\tclass=\"mail_massconnect__employee-list_added-employees_show-button\"\n\t\t\t\t\tdata-test-id=\"mail_massconnect__employee-list_added-employees_show-button\"\n\t\t\t\t\t@click=\"showAddedEmployees = !showAddedEmployees\"\n\t\t\t\t>\n\t\t\t\t\t<div class=\"mail_massconnect__employee-list_added-employees_show-button-text\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_SHOW_ADDED_TITLE') }}\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"mail_massconnect__employee-list_added-employees_show-button-icon\">\n\t\t\t\t\t\t<BIcon :name=\"outline.CHEVRON_DOWN_L\"\n\t\t\t\t\t\t\t@click=\"actionsMenuActive = true\"\n\t\t\t\t\t\t\t:size=\"18\"\n\t\t\t\t\t\t\tcolor=\"var(--ui-color-palette-gray-50)\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t</BIcon>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<EmployeeListTable\n\t\t\t\t\tv-if=\"showAddedEmployees\"\n\t\t\t\t\t:isLoginColumnShown=\"isLoginColumnShown\"\n\t\t\t\t\t:employees=\"addedEmployees\"\n\t\t\t\t\t:readonlyMode=\"true\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	var PrepareOptionsPhrasesMixin = {
	  methods: {
	    prepareOptionPhrases: function prepareOptionPhrases(options) {
	      return options.map(function (option) {
	        return {
	          label: main_core.Loc.getMessage(option.labelKey),
	          value: option.value
	        };
	      });
	    }
	  }
	};

	var PreparedIndirectPhraseMixin = {
	  methods: {
	    preparedIndirectPhrase: function preparedIndirectPhrase(phraseCode, indirectCode) {
	      var phrase = this.$Bitrix.Loc.getMessage(phraseCode);
	      var parts = phrase.split(indirectCode);
	      return {
	        beforeText: parts[0] || null,
	        afterText: parts[1] || null
	      };
	    }
	  }
	};

	// @vue/component
	var BitrixSettingSelector = {
	  props: {
	    modelValue: {
	      type: [String, Number],
	      required: true
	    },
	    options: {
	      type: Array,
	      required: true
	    },
	    dialogOptions: {
	      type: Object,
	      required: false,
	      "default": null
	    }
	  },
	  emits: ['update:modelValue'],
	  selectorInstance: null,
	  itemOnSelectHandler: null,
	  watch: {
	    modelValue: function modelValue(newValue) {
	      if (this.selectorInstance && newValue !== this.selectorInstance.getSelected()) {
	        this.selectorInstance.select(newValue);
	      }
	    }
	  },
	  mounted: function mounted() {
	    var _this = this;
	    var settingsMap = new Map();
	    this.options.forEach(function (option) {
	      settingsMap.set(option.value, option.label);
	    });
	    var settingSelectorOptions = {
	      settingsMap: Object.fromEntries(settingsMap),
	      selectedOptionKey: this.modelValue
	    };
	    if (this.dialogOptions) {
	      settingSelectorOptions.dialogOptions = this.dialogOptions;
	    }
	    this.selectorInstance = new mail_settingSelector.SettingSelector(settingSelectorOptions);
	    this.itemOnSelectHandler = function (event) {
	      var _event$getData = event.getData(),
	        selectedItem = _event$getData.item;
	      _this.$emit('update:modelValue', selectedItem.getId());
	    };
	    if (this.selectorInstance.settingDialog) {
	      this.selectorInstance.settingDialog.subscribe('Item:onSelect', this.itemOnSelectHandler);
	    }
	    this.selectorInstance.renderTo(this.$el);
	  },
	  beforeUnmount: function beforeUnmount() {
	    if (this.selectorInstance.settingDialog) {
	      this.selectorInstance.settingDialog.unsubscribe('Item:onSelect', this.itemOnSelectHandler);
	    }
	    if (this.selectorInstance && this.selectorInstance.settingDialog) {
	      this.selectorInstance.settingDialog.destroy();
	    }
	  },
	  template: '<div></div>'
	};

	var MailIntegrationOptions = {
	  syncPeriodOptions: [{
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_MAIL_INTEGRATION_OPTION_SYNC_PERIOD_DAY',
	    value: MailSyncPeriod.DAY
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_MAIL_INTEGRATION_OPTION_SYNC_PERIOD_WEEK',
	    value: MailSyncPeriod.WEEK
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_MAIL_INTEGRATION_OPTION_SYNC_PERIOD_MONTH',
	    value: MailSyncPeriod.MONTH
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_MAIL_INTEGRATION_OPTION_SYNC_PERIOD_TWO_MONTHS',
	    value: MailSyncPeriod.TWO_MONTHS
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_MAIL_INTEGRATION_OPTION_SYNC_PERIOD_THREE_MONTHS',
	    value: MailSyncPeriod.THREE_MONTHS
	  }]
	};

	// @vue/component
	var MailIntegration = {
	  name: 'mail-integration',
	  components: {
	    BitrixSettingSelector: BitrixSettingSelector
	  },
	  mixins: [LocalizationMixin, PrepareOptionsPhrasesMixin, PreparedIndirectPhraseMixin],
	  props: {
	    /** @type MailIntegrationSettingsType */
	    modelValue: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:modelValue'],
	  computed: {
	    localModelValue: {
	      get: function get() {
	        return this.modelValue;
	      },
	      set: function set(newValue) {
	        this.$emit('update:modelValue', newValue);
	      }
	    },
	    syncLabel: function syncLabel() {
	      return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_MAIL_SYNC_LABEL', '#PERIOD#');
	    },
	    syncPeriodOptions: function syncPeriodOptions() {
	      return this.prepareOptionPhrases(MailIntegrationOptions.syncPeriodOptions);
	    }
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__integration-block\">\n\t\t\t<div class=\"mail_massconnect__integration-block_header\">\n\t\t\t\t<div class=\"mail_massconnect__integration-block_title_group\">\n\t\t\t\t\t<div class=\"mail_massconnect__integration-block_icon --mail\"></div>\n\t\t\t\t\t<span class=\"mail_massconnect__integration-block_title\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_MAIL_TITLE') }}\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div class=\"mail_massconnect__integration-block_content-wrapper\">\n\t\t\t\t<div class=\"mail_massconnect__integration-block_content\">\n\t\t\t\t\t<div class=\"mail_massconnect__checkbox-group\">\n\t\t\t\t\t\t<input\n\t\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\t\tid=\"mail_massconnect__mail-sync\"\n\t\t\t\t\t\t\tv-model=\"localModelValue.sync.enabled\"\n\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__mail-sync_checkbox\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<div \n\t\t\t\t\t\t\tclass=\"mail_massconnect__indirect-label\" \n\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__mail-sync_label\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<label for=\"mail_massconnect__mail-sync\">\n\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_before\">\n\t\t\t\t\t\t\t\t\t{{ syncLabel.beforeText }}\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t<BitrixSettingSelector\n\t\t\t\t\t\t\t\tv-model=\"localModelValue.sync.periodValue\"\n\t\t\t\t\t\t\t\t:options=\"syncPeriodOptions\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<label for=\"mail_massconnect__mail-sync\">\n\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_after\">\n\t\t\t\t\t\t\t\t\t{{ syncLabel.afterText }}\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	var UserSelector = {
	  props: {
	    modelValue: {
	      type: Array,
	      "default": function _default() {
	        return [];
	      }
	    }
	  },
	  emits: ['update:modelValue'],
	  selectorInstance: null,
	  targetNode: null,
	  watch: {
	    modelValue: function modelValue(newValue) {
	      var _this = this;
	      if (!this.selectorInstance) {
	        return;
	      }
	      var newItemsSet = new Set(newValue.map(function (item) {
	        return "".concat(item.entityId, ":").concat(item.id);
	      }));
	      var currentTags = this.selectorInstance.getTags();
	      var currentTagsSet = new Set(currentTags.map(function (tag) {
	        return "".concat(tag.getEntityId(), ":").concat(tag.getId());
	      }));
	      currentTags.forEach(function (tag) {
	        var tagId = "".concat(tag.getEntityId(), ":").concat(tag.getId());
	        if (!newItemsSet.has(tagId)) {
	          _this.selectorInstance.removeTag(tag);
	        }
	      });
	      newValue.forEach(function (item) {
	        var itemId = "".concat(item.entityId, ":").concat(item.id);
	        if (!currentTagsSet.has(itemId)) {
	          _this.selectorInstance.addTag({
	            id: item.id,
	            entityId: item.entityId,
	            title: item.name
	          });
	        }
	      });
	    }
	  },
	  mounted: function mounted() {
	    this.selectorInstance = new ui_entitySelector.TagSelector({
	      dialogOptions: {
	        width: 425,
	        height: 320,
	        multiple: true,
	        context: 'MAIL_CRM_QUEUE',
	        preselectedItems: this.modelValue.map(function (item) {
	          return [item.entityId, item.id];
	        }),
	        entities: [{
	          id: 'user',
	          options: {
	            intranetUsersOnly: true,
	            emailUsers: false,
	            inviteEmployeeLink: false
	          }
	        }, {
	          id: 'department',
	          options: {
	            selectMode: 'departmentsOnly'
	          }
	        }]
	      },
	      events: {
	        onAfterTagAdd: this.onUpdate,
	        onAfterTagRemove: this.onUpdate
	      }
	    });
	    this.selectorInstance.renderTo(this.$el);
	  },
	  beforeUnmount: function beforeUnmount() {
	    var dialog = this.selectorInstance.getDialog();
	    if (dialog) {
	      dialog.destroy();
	    }
	  },
	  methods: {
	    onUpdate: function onUpdate() {
	      var selectedItems = this.selectorInstance.getTags().map(function (tag) {
	        return {
	          id: tag.getId(),
	          entityId: tag.getEntityId(),
	          name: tag.getTitle()
	        };
	      });
	      this.$emit('update:modelValue', selectedItems);
	    }
	  },
	  template: '<div></div>'
	};

	var CrmIntegrationOptions = {
	  syncPeriodOptions: [{
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SYNC_PERIOD_WEEK',
	    value: CrmSyncPeriod.WEEK
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SYNC_PERIOD_MONTH',
	    value: CrmSyncPeriod.MONTH
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SYNC_PERIOD_ALL_TIME',
	    value: CrmSyncPeriod.ALL_TIME
	  }],
	  createActionOptions: [{
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_CREATE_ACTION_LEAD',
	    value: CrmCreateAction.LEAD
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_CREATE_ACTION_CONTACT',
	    value: CrmCreateAction.CONTACT
	  }],
	  sourceOptions: [{
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_CALL',
	    value: CrmSource.CALL
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_EMAIL',
	    value: CrmSource.EMAIL
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_WEB',
	    value: CrmSource.WEB
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_ADVERTISING',
	    value: CrmSource.ADVERTISING
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_PARTNER',
	    value: CrmSource.PARTNER
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_RECOMMENDATION',
	    value: CrmSource.RECOMMENDATION
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_TRADE_SHOW',
	    value: CrmSource.TRADE_SHOW
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_WEBFORM',
	    value: CrmSource.WEBFORM
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_CALLBACK',
	    value: CrmSource.CALLBACK
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_RC_GENERATOR',
	    value: CrmSource.RC_GENERATOR
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_STORE',
	    value: CrmSource.STORE
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_OTHER',
	    value: CrmSource.OTHER
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_BOOKING',
	    value: CrmSource.BOOKING
	  }, {
	    labelKey: 'MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CRM_INTEGRATION_OPTION_SOURCE_REPEAT_SALE',
	    value: CrmSource.REPEAT_SALE
	  }],
	  crmLeadSourceDialogOptions: {
	    width: 300,
	    height: 300,
	    enableSearch: true
	  }
	};

	// @vue/component
	var CrmIntegration = {
	  name: 'crm-integration',
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  components: {
	    Switcher: ui_vue3_components_switcher.Switcher,
	    BitrixSettingSelector: BitrixSettingSelector,
	    UserSelector: UserSelector
	  },
	  mixins: [LocalizationMixin, PrepareOptionsPhrasesMixin, PreparedIndirectPhraseMixin],
	  props: {
	    /** @type CrmIntegrationSettingsType */
	    modelValue: {
	      type: Object,
	      required: true
	    },
	    canEditCrmIntegration: {
	      type: Boolean,
	      "default": false
	    }
	  },
	  emits: ['update:modelValue'],
	  data: function data() {
	    return {
	      showAddressTextarea: false,
	      crmLeadSourceDialogOptions: CrmIntegrationOptions.crmLeadSourceDialogOptions
	    };
	  },
	  computed: {
	    localModelValue: {
	      get: function get() {
	        return this.modelValue;
	      },
	      set: function set(newValue) {
	        this.$emit('update:modelValue', newValue);
	      }
	    },
	    syncLabel: function syncLabel() {
	      return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_LABEL', '#PERIOD#');
	    },
	    incomingLabel: function incomingLabel() {
	      return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_LABEL', '#INCOMING#');
	    },
	    outgoingLabel: function outgoingLabel() {
	      return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_LABEL', '#OUTGOING#');
	    },
	    leadSourceIncomingLabel: function leadSourceIncomingLabel() {
	      return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_LABEL', '#INCOMING_CURRENT#');
	    },
	    syncPeriodOptions: function syncPeriodOptions() {
	      return this.prepareOptionPhrases(CrmIntegrationOptions.syncPeriodOptions);
	    },
	    createActionOptions: function createActionOptions() {
	      return this.prepareOptionPhrases(CrmIntegrationOptions.createActionOptions);
	    },
	    sourceOptions: function sourceOptions() {
	      return this.prepareOptionPhrases(CrmIntegrationOptions.sourceOptions);
	    },
	    switcherOptions: function switcherOptions() {
	      return {
	        size: ui_switcher.SwitcherSize.large,
	        showStateTitle: false,
	        useAirDesign: true
	      };
	    },
	    noAccessHintParams: function noAccessHintParams() {
	      return {
	        text: this.loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_NO_ACCESS_HINT'),
	        popupOptions: {
	          className: 'mail_massconnect-hint',
	          darkMode: false,
	          offsetTop: 2,
	          background: 'var(--ui-color-bg-content-inapp)',
	          padding: 6,
	          angle: true,
	          targetContainer: document.body,
	          offsetLeft: 20
	        }
	      };
	    }
	  },
	  methods: {
	    handleSwitcherClick: function handleSwitcherClick() {
	      if (this.canEditCrmIntegration) {
	        this.localModelValue.enabled = !this.localModelValue.enabled;
	      }
	    }
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__integration-block\" :class=\"{ '--disabled': !localModelValue.enabled }\">\n\t\t\t<div \n\t\t\t\tclass=\"mail_massconnect__integration-block_header\"\n\t\t\t\tdata-test-id=\"mail_massconnect__settings_crmr-integration_header\"\n\t\t\t>\n\t\t\t\t<div class=\"mail_massconnect__integration-block_title_group\">\n\t\t\t\t\t<div class=\"mail_massconnect__integration-block_icon --crm\"></div>\n\t\t\t\t\t<span class=\"mail_massconnect__integration-block_title\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CRM_TITLE') }}\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"mail_massconnect__integration-block_switcher-container\" >\n\t\t\t\t\t<Switcher\n\t\t\t\t\t\t:isChecked=\"localModelValue.enabled\"\n\t\t\t\t\t\t:isDisabled=\"!canEditCrmIntegration\"\n\t\t\t\t\t\t:options=\"switcherOptions\"\n\t\t\t\t\t\tv-hint=\"!canEditCrmIntegration ? noAccessHintParams : undefined\"\n\t\t\t\t\t\t@click=\"handleSwitcherClick\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<transition name=\"mail_massconnect__integration-block_slide-down\">\n\t\t\t\t<div v-if=\"localModelValue.enabled\" class=\"mail_massconnect__integration-block_content-wrapper\">\n\t\t\t\t\t<div class=\"mail_massconnect__integration-block_content\">\n\t\t\t\t\t\t<div class=\"mail_massconnect__checkbox-group\">\n\t\t\t\t\t\t\t<input\n\t\t\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\t\t\tid=\"mail_massconnect__crm-sync\"\n\t\t\t\t\t\t\t\tv-model=\"localModelValue.sync.enabled\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-integration_crm-sync_checkbox\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<div \n\t\t\t\t\t\t\t\tclass=\"mail_massconnect__indirect-label\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-integration_crm-sync_label\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t\t\t<label for=\"mail_massconnect__crm-sync\">\n\t\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_before\">\n\t\t\t\t\t\t\t\t\t\t{{ syncLabel.beforeText }}\n\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t\t<BitrixSettingSelector\n\t\t\t\t\t\t\t\t\tv-model=\"localModelValue.sync.periodValue\"\n\t\t\t\t\t\t\t\t\t:options=\"syncPeriodOptions\"\n\t\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t\t<label for=\"mail_massconnect__crm-sync\">\n\t\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_after\">\n\t\t\t\t\t\t\t\t\t\t{{ syncLabel.afterText }}\n\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"mail_massconnect__integration-hint\">\n\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SYNC_HINT') }}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"mail_massconnect__checkbox-group\">\n\t\t\t\t\t\t\t<input\n\t\t\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\t\t\tid=\"mail_massconnect__assign-known\"\n\t\t\t\t\t\t\t\tv-model=\"localModelValue.assignKnownClientEmails\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-integration_assign-known_checkbox\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<label for=\"mail_massconnect__assign-known\">\n\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text\">\n\t\t\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_ASSIGN_KNOWN_LABEL') }}\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"mail_massconnect__checkbox-group\">\n\t\t\t\t\t\t\t<input\n\t\t\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\t\t\tid=\"mail_massconnect__incoming-new\"\n\t\t\t\t\t\t\t\tv-model=\"localModelValue.incoming.enabled\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-integration_incoming-new_checkbox\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<div \n\t\t\t\t\t\t\t\tclass=\"mail_massconnect__indirect-label\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-integration_incoming-new_label\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t\t\t<label for=\"mail_massconnect__incoming-new\">\n\t\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_before\">\n\t\t\t\t\t\t\t\t\t\t{{ incomingLabel.beforeText }}\n\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t\t<BitrixSettingSelector\n\t\t\t\t\t\t\t\t\tv-model=\"localModelValue.incoming.createAction\"\n\t\t\t\t\t\t\t\t\t:options=\"createActionOptions\"\n\t\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t\t<label for=\"mail_massconnect__incoming-new\">\n\t\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_after\">\n\t\t\t\t\t\t\t\t\t\t{{ incomingLabel.afterText }}\n\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"mail_massconnect__integration-hint\">\n\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_INCOMING_HINT') }}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"mail_massconnect__checkbox-group\">\n\t\t\t\t\t\t\t<input\n\t\t\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\t\t\tid=\"mail_massconnect__outgoing-new\"\n\t\t\t\t\t\t\t\tv-model=\"localModelValue.outgoing.enabled\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-integration_outgoing-new_checkbox\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<div \n\t\t\t\t\t\t\t\tclass=\"mail_massconnect__indirect-label\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-integration_outgoing-new_label\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t\t\t<label for=\"mail_massconnect__outgoing-new\">\n\t\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_before\">\n\t\t\t\t\t\t\t\t\t\t{{ outgoingLabel.beforeText }}\n\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t\t<BitrixSettingSelector\n\t\t\t\t\t\t\t\t\tv-model=\"localModelValue.outgoing.createAction\"\n\t\t\t\t\t\t\t\t\t:options=\"createActionOptions\"\n\t\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t\t<label for=\"mail_massconnect__outgoing-new\">\n\t\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_after\">\n\t\t\t\t\t\t\t\t\t\t{{ outgoingLabel.afterText }}\n\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"mail_massconnect__integration-hint\">\n\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_OUTGOING_HINT') }}\n\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t<div \n\t\t\t\t\t\t\tclass=\"mail_massconnect__group-inline\"\n\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_source_group\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<span class=\"mail_massconnect__group-inline_label\">\n\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text\">\n\t\t\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_LABEL') }}\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t<BitrixSettingSelector\n\t\t\t\t\t\t\t\tv-model=\"localModelValue.source\"\n\t\t\t\t\t\t\t\t:options=\"sourceOptions\"\n\t\t\t\t\t\t\t\t:dialog-options=\"crmLeadSourceDialogOptions\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t</div>\n\n\t\t\t\t\t\t<span class=\"mail_massconnect__group-inline_label\">\n\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_before\">\n\t\t\t\t\t\t\t\t{{ leadSourceIncomingLabel.beforeText }}\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t<a\n\t\t\t\t\t\t\t\thref=\"#\"\n\t\t\t\t\t\t\t\tclass=\"mail_massconnect__set-textarea-show\"\n\t\t\t\t\t\t\t\t@click.prevent=\"showAddressTextarea = !showAddressTextarea\"\n\t\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_show-address-textarea_link\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__set-textarea-show_text\">\n\t\t\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_BUTTON_LABEL') }}\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t<div\n\t\t\t\t\t\t\t\t\tclass=\"ui-icon-set --chevron-down\"\n\t\t\t\t\t\t\t\t\tstyle=\"--ui-icon-set__icon-size: 16px; --ui-icon-set__icon-color: #6a737f;\"\n\t\t\t\t\t\t\t\t>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t<span class=\"mail_massconnect__label-text_after\">\n\t\t\t\t\t\t\t\t{{ leadSourceIncomingLabel.afterText }}\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t</span>\n\t\t\t\t\t\t<textarea\n\t\t\t\t\t\t\tv-if=\"showAddressTextarea\"\n\t\t\t\t\t\t\tv-model=\"localModelValue.leadCreationAddresses\"\n\t\t\t\t\t\t\tclass=\"mail_massconnect__control-textarea\"\n\t\t\t\t\t\t\t:placeholder=\"loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_SOURCE_INCOMING_CURRENT_PLACEHOLDER')\"\n\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_address-textarea\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t</textarea>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"mail_massconnect__integration-block_content\">\n\t\t\t\t\t\t<div \n\t\t\t\t\t\t\tclass=\"mail_massconnect__user-selector-group\"\n\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_crm-user-queue_group\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<span class=\"mail_massconnect__group-inline_label\">\n\t\t\t\t\t\t\t\t<span class=\"mail_massconnect__label_user-selector_text\">\n\t\t\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_SELECT_MAILBOX_SETTINGS_CRM_QUEUE_LABEL') }}\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t<UserSelector\n\t\t\t\t\t\t\t\tv-model=\"localModelValue.responsibleQueue\"\n\t\t\t\t\t\t\t\tclass=\"mail_massconnect__control-user-selector\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</transition>\n\t\t</div>\n\t"
	};

	// @vue/component
	var CalendarIntegration = {
	  name: 'calendar-integration',
	  components: {
	    Switcher: ui_vue3_components_switcher.Switcher
	  },
	  mixins: [LocalizationMixin],
	  props: {
	    /** @type CalendarIntegrationSettingsType */
	    modelValue: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:modelValue'],
	  computed: {
	    localModelValue: {
	      get: function get() {
	        return this.modelValue;
	      },
	      set: function set(newValue) {
	        this.$emit('update:modelValue', newValue);
	      }
	    },
	    switcherOptions: function switcherOptions() {
	      return {
	        size: ui_switcher.SwitcherSize.large,
	        showStateTitle: false,
	        useAirDesign: true
	      };
	    }
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__integration-block\" :class=\"{ '--disabled': !localModelValue.enabled }\">\n\t\t\t<div \n\t\t\t\tclass=\"mail_massconnect__integration-block_header\"\n\t\t\t\tdata-test-id=\"mail_massconnect__settings_calendar-integration_header\"\n\t\t\t>\n\t\t\t\t<div class=\"mail_massconnect__integration-block_title_group\">\n\t\t\t\t\t<div class=\"mail_massconnect__integration-block_icon --calendar\"></div>\n\t\t\t\t\t<span class=\"mail_massconnect__integration-block_title\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CALENDAR_TITLE') }}\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t\t<Switcher\n\t\t\t\t\t:isChecked=\"localModelValue.enabled\"\n\t\t\t\t\t:options=\"switcherOptions\"\n\t\t\t\t\t@click=\"localModelValue.enabled = !localModelValue.enabled\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t\t<transition name=\"mail_massconnect__integration-block_slide-down\">\n\t\t\t\t<div v-if=\"localModelValue.enabled\" class=\"mail_massconnect__integration-block_content\">\n\t\t\t\t\t<div class=\"mail_massconnect__checkbox-group\">\n\t\t\t\t\t\t<input\n\t\t\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t\t\tid=\"mail_massconnect__auto-add-events\"\n\t\t\t\t\t\t\tv-model=\"localModelValue.autoAddEvents\"\n\t\t\t\t\t\t\tdata-test-id=\"mail_massconnect__settings_calendar-integration_auto-add-events-checkbox\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<label for=\"mail_massconnect__auto-add-events\">\n\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CALENDAR_AUTO_ADD') }}\n\t\t\t\t\t\t</label>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</transition>\n\t\t</div>\n\t"
	};

	function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$4(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	var MailboxSettings = {
	  components: {
	    MailIntegration: MailIntegration,
	    CrmIntegration: CrmIntegration,
	    CalendarIntegration: CalendarIntegration,
	    Switcher: ui_vue3_components_switcher.Switcher
	  },
	  mixins: [LocalizationMixin],
	  computed: _objectSpread$4(_objectSpread$4({}, ui_vue3_pinia.mapState(useWizardStore, ['mailSettings', 'crmSettings', 'calendarSettings', 'analyticsSource', 'permissions'])), {}, {
	    switcherOptions: function switcherOptions() {
	      return {
	        size: ui_switcher.SwitcherSize.large,
	        showStateTitle: false,
	        useAirDesign: true
	      };
	    }
	  }),
	  methods: _objectSpread$4(_objectSpread$4({}, ui_vue3_pinia.mapActions(useWizardStore, ['setMailSettings', 'setCrmSettings', 'setCalendarSettings'])), {}, {
	    onStepComplete: function onStepComplete() {
	      var calendarState = this.calendarSettings.enabled ? 'true' : 'false';
	      var crmState = this.crmSettings.enabled ? 'true' : 'false';
	      ui_analytics.sendData({
	        tool: 'mail',
	        event: 'mailbox_mass_step3',
	        category: 'mail_mass_ops',
	        c_section: this.analyticsSource,
	        p1: "integrationCalendar_".concat(calendarState),
	        p2: "integrationCRM_".concat(crmState)
	      });
	    }
	  }),
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__mailbox-settings_form\">\n\t\t\t<div class=\"mail_massconnect__section-title_container\">\n\t\t\t\t<span class=\"mail_massconnect__section-title\">\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CARD_TITLE') }}\n\t\t\t\t</span>\n\t\t\t\t<span class=\"mail_massconnect__section-description\">\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CARD_DESCRIPTION') }}\n\t\t\t\t</span>\n\t\t\t</div>\n\n\t\t\t<MailIntegration\n\t\t\t\t:model-value=\"mailSettings\"\n\t\t\t\t@update:model-value=\"setMailSettings($event)\"\n\t\t\t/>\n\n\t\t\t<CrmIntegration\n\t\t\t\t:model-value=\"crmSettings\"\n\t\t\t\t:can-edit-crm-integration=\"permissions.canEditCrmIntegration\"\n\t\t\t\t@update:model-value=\"setCrmSettings($event)\"\n\t\t\t/>\n\n\t\t\t<CalendarIntegration\n\t\t\t\t:model-value=\"calendarSettings\"\n\t\t\t\t@update:model-value=\"setCalendarSettings($event)\"\n\t\t\t/>\n\t\t</div>\n\t"
	};

	var EventName = {
	  MAILBOX_APPEND_SUCCESS: 'mail-massconnect-mailboxes-append-success'
	};

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
	function _regeneratorRuntime$2() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime$2 = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$5(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

	// @vue/component
	var ConnectionStatus = {
	  name: 'connection-status',
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  mixins: [LocalizationMixin],
	  props: {
	    /** @type MailboxPayload[] */
	    mailboxes: {
	      type: Array,
	      required: true
	    },
	    /** @type MassConnectDataType */
	    massConnectData: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['fix-errors'],
	  setup: function setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle
	    };
	  },
	  data: function data() {
	    return {
	      totalMailboxes: 0,
	      processedCount: 0,
	      successfulCount: 0,
	      errorCount: 0,
	      errorDetails: [],
	      isCancelled: false,
	      isFinished: false
	    };
	  },
	  computed: _objectSpread$5(_objectSpread$5({}, ui_vue3_pinia.mapState(useWizardStore, ['analyticsSource', 'calendarSettings', 'crmSettings'])), {}, {
	    hasErrors: function hasErrors() {
	      return this.isFinished && this.errorCount > 0;
	    },
	    isSuccess: function isSuccess() {
	      return this.isFinished && this.errorCount === 0;
	    },
	    statusText: function statusText() {
	      return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_STATUS', {
	        '#SUCCESSFUL_CNT#': this.successfulCount,
	        '#TOTAL_CNT#': this.totalMailboxes,
	        '#ERROR_CNT#': this.errorCount
	      });
	    },
	    errorText: function errorText() {
	      return main_core.Loc.getMessagePlural('MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_TITLE', this.errorCount, {
	        '#ERROR_CNT#': this.errorCount
	      });
	    }
	  }),
	  created: function created() {
	    main_core.Dom.hide(document.querySelector('.ui-side-panel-toolbar'));
	    this.totalMailboxes = this.mailboxes.length;
	    this.startProcessing();
	  },
	  methods: {
	    startProcessing: function startProcessing() {
	      var _this = this;
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$2().mark(function _callee() {
	        var massConnectId, _result$data, result, message, _error$errors$;
	        return _regeneratorRuntime$2().wrap(function _callee$(_context) {
	          while (1) switch (_context.prev = _context.next) {
	            case 0:
	              massConnectId = null;
	              _context.prev = 1;
	              _context.next = 4;
	              return Api.saveMailboxConnectionData(_this.massConnectData);
	            case 4:
	              result = _context.sent;
	              massConnectId = result === null || result === void 0 ? void 0 : (_result$data = result.data) === null || _result$data === void 0 ? void 0 : _result$data.id;
	              if (massConnectId) {
	                _context.next = 8;
	                break;
	              }
	              throw new Error('Failed to save mailbox connection data');
	            case 8:
	              _context.next = 18;
	              break;
	            case 10:
	              _context.prev = 10;
	              _context.t0 = _context["catch"](1);
	              message = '';
	              if (main_core.Type.isArray(_context.t0.errors) && _context.t0.errors[0]) {
	                message = (_error$errors$ = _context.t0.errors[0]) === null || _error$errors$ === void 0 ? void 0 : _error$errors$.message;
	              } else {
	                message = _context.t0.message;
	              }
	              _this.errorDetails = _this.mailboxes.map(function (mailbox) {
	                return {
	                  customData: {
	                    userIdToConnect: mailbox.userIdToConnect
	                  },
	                  message: message
	                };
	              });
	              _this.errorCount = _this.mailboxes.length;
	              _this.isFinished = true;
	              return _context.abrupt("return");
	            case 18:
	              _this.processMailboxes(_this.mailboxes, massConnectId);
	            case 19:
	            case "end":
	              return _context.stop();
	          }
	        }, _callee, null, [[1, 10]]);
	      }))();
	    },
	    processMailboxes: function processMailboxes(mailboxes, massConnectId) {
	      var _this2 = this;
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$2().mark(function _callee2() {
	        var _iterator, _step, mailbox, calendarState, crmState;
	        return _regeneratorRuntime$2().wrap(function _callee2$(_context2) {
	          while (1) switch (_context2.prev = _context2.next) {
	            case 0:
	              _iterator = _createForOfIteratorHelper(_this2.mailboxes);
	              _context2.prev = 1;
	              _iterator.s();
	            case 3:
	              if ((_step = _iterator.n()).done) {
	                _context2.next = 23;
	                break;
	              }
	              mailbox = _step.value;
	              if (!_this2.isCancelled) {
	                _context2.next = 8;
	                break;
	              }
	              // push cancellation error for each unprocessed mailbox to show in the error fixing step
	              _this2.errorDetails.push({
	                code: 0,
	                customData: {
	                  userIdToConnect: mailbox.userIdToConnect
	                },
	                message: '' // ToDo: localize cancellation message
	              });
	              return _context2.abrupt("continue", 21);
	            case 8:
	              _context2.prev = 8;
	              _context2.next = 11;
	              return Api.connectMailbox(mailbox, massConnectId);
	            case 11:
	              _this2.successfulCount++;
	              _context2.next = 18;
	              break;
	            case 14:
	              _context2.prev = 14;
	              _context2.t0 = _context2["catch"](8);
	              _this2.errorCount++;
	              if (_context2.t0.errors[0]) {
	                _this2.errorDetails.push(_context2.t0.errors[0]);
	              }
	            case 18:
	              _context2.prev = 18;
	              _this2.processedCount++;
	              return _context2.finish(18);
	            case 21:
	              _context2.next = 3;
	              break;
	            case 23:
	              _context2.next = 28;
	              break;
	            case 25:
	              _context2.prev = 25;
	              _context2.t1 = _context2["catch"](1);
	              _iterator.e(_context2.t1);
	            case 28:
	              _context2.prev = 28;
	              _iterator.f();
	              return _context2.finish(28);
	            case 31:
	              _this2.isFinished = true;
	              calendarState = _this2.calendarSettings.enabled ? 'true' : 'false';
	              crmState = _this2.crmSettings.enabled ? 'true' : 'false';
	              ui_analytics.sendData({
	                tool: 'mail',
	                event: 'mailbox_mass_complete',
	                category: 'mail_mass_ops',
	                c_section: _this2.analyticsSource,
	                p1: "integrationCalendar_".concat(calendarState),
	                p2: "integrationCRM_".concat(crmState)
	              });
	              if (_this2.successfulCount > 0 && !_this2.isCancelled) {
	                BX.SidePanel.Instance.postMessage(window, EventName.MAILBOX_APPEND_SUCCESS);
	              }
	            case 36:
	            case "end":
	              return _context2.stop();
	          }
	        }, _callee2, null, [[1, 25, 28, 31], [8, 14, 18, 21]]);
	      }))();
	    },
	    handleCancel: function handleCancel() {
	      this.isCancelled = true;
	      this.isFinished = true;
	    },
	    handleFixErrors: function handleFixErrors() {
	      main_core.Dom.show(document.querySelector('.ui-side-panel-toolbar'));
	      this.$emit('fix-errors', this.errorDetails, this.successfulCount);
	    },
	    closeWizard: function closeWizard() {
	      var slider = BX.SidePanel.Instance.getTopSlider();
	      if (slider) {
	        slider.close();
	      }
	    }
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__connection-status-view\">\n\t\t\t<div \n\t\t\t\tv-if=\"!isFinished\" \n\t\t\t\tclass=\"mail_massconnect__connection-status-view_content\"\n\t\t\t\tdata-test-id=\"mail_massconnect__connection-status-view_processing\"\n\t\t\t>\n\t\t\t\t<div class=\"mail_massconnect__connection-status-view_icon --processing\"></div>\n\t\t\t\t<span class=\"mail_massconnect__connection-status-view_text\">{{ statusText }}</span>\n\t\t\t\t<UiButton\n\t\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_CANCEL_BUTTON_TITLE')\"\n\t\t\t\t\t:style=\"AirButtonStyle.FILLED\"\n\t\t\t\t\t@click=\"handleCancel\"\n\t\t\t\t/>\n\t\t\t</div>\n\n\t\t\t<div \n\t\t\t\tv-if=\"isSuccess\" \n\t\t\t\tclass=\"mail_massconnect__connection-status-view_content\"\n\t\t\t\tdata-test-id=\"mail_massconnect__connection-status-view_success\"\n\t\t\t>\n\t\t\t\t<div class=\"mail_massconnect__connection-status-view_icon --success\"></div>\n\t\t\t\t<span class=\"mail_massconnect__connection-status-view_text\">\n\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_SUCCESS_ALL_CONNECTED') }}\n\t\t\t\t</span>\n\t\t\t\t<UiButton\n\t\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_WIZARD_BUTTON_TITLE')\"\n\t\t\t\t\t:style=\"AirButtonStyle.FILLED\"\n\t\t\t\t\t@click=\"closeWizard\"\n\t\t\t\t/>\n\t\t\t</div>\n\n\t\t\t<div \n\t\t\t\tv-if=\"hasErrors\" \n\t\t\t\tclass=\"mail_massconnect__connection-status-view_content\"\n\t\t\t\tdata-test-id=\"mail_massconnect__connection-status-view_has-errors\"\n\t\t\t>\n\t\t\t\t<div class=\"mail_massconnect__connection-status-view_icon --failure\"></div>\n\t\t\t\t<div class=\"mail_massconnect__connection-status_failure-text-container\">\n\t\t\t\t\t<div class=\"mail_massconnect__connection-status_failure-text-title\">\n\t\t\t\t\t\t{{ errorText }}\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"mail_massconnect__connection-status_failure-text-description\">\n\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_DESCRIPTION') }}\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div\n\t\t\t\t\tclass=\"mail_massconnect__connection-status-view_buttons\"\n\t\t\t\t\tdata-test-id=\"mail_massconnect__connection-status-view_has-errors_buttons\"\n\t\t\t\t>\n\t\t\t\t\t<UiButton\n\t\t\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_FIX_BUTTON_TITLE')\"\n\t\t\t\t\t\t:style=\"AirButtonStyle.FILLED\"\n\t\t\t\t\t\t:rightCounterValue=\"errorCount\"\n\t\t\t\t\t\tsize=\"ui-btn-lg\"\n\t\t\t\t\t\tclass=\"mail_massconnect__connection-status-view_has-errors_buttons_fix-button\"\n\t\t\t\t\t\t@click=\"handleFixErrors\"\n\t\t\t\t\t/>\n\t\t\t\t\t<UiButton\n\t\t\t\t\t\t:text=\"loc('MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_WIZARD_BUTTON_TITLE')\"\n\t\t\t\t\t\t:style=\"AirButtonStyle.PLAIN\"\n\t\t\t\t\t\tclass=\"mail_massconnect__connection-status-view_has-errors_buttons_close-button\"\n\t\t\t\t\t\tsize=\"ui-btn-lg\"\n\t\t\t\t\t\t@click=\"closeWizard\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	var WizardHint = {
	  name: 'WizardHint',
	  mixins: [LocalizationMixin, PreparedIndirectPhraseMixin],
	  computed: {
	    hintDescriptionText: function hintDescriptionText() {
	      return this.preparedIndirectPhrase('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_HINT_DESCRIPTION', '#HELP_LINK#');
	    }
	  },
	  methods: {
	    goToBPHelp: function goToBPHelp(event) {
	      if (top.BX && top.BX.Helper) {
	        if (event) {
	          event.preventDefault();
	        }
	        top.BX.Helper.show('redirect=detail&code=26953018');
	      }
	    }
	  },
	  template: "\n\t\t<div class=\"mail_massconnect__wizard_card\">\n\t\t\t<div class=\"mail_massconnect__wizard_card_hint\">\n\t\t\t\t<div class=\"mail_massconnect__section-title_container\">\n\t\t\t\t\t<span class=\"mail_massconnect__section-description\">\n\t\t\t\t\t\t<span>{{ hintDescriptionText.beforeText }}</span>\n\t\t\t\t\t\t<span class=\"mail_massconnect__section-description_hint-link\" @click=\"goToBPHelp\">\n\t\t\t\t\t\t\t{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_HINT_HELP_LINK') }}\n\t\t\t\t\t\t</span>\n\t\t\t\t\t\t<span>{{ hintDescriptionText.afterText }}</span>\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	function _regeneratorRuntime$3() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime$3 = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys$6(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

	/**
	 * @typedef {import('vue').Component & {title: string}} WizardStepComponent
	 */

	// @vue/component
	var WizardContainer = {
	  components: {
	    WizardProgressBar: WizardProgressBar,
	    WizardNavigation: WizardNavigation,
	    ConnectionStatus: ConnectionStatus,
	    WizardHint: WizardHint
	  },
	  mixins: [LocalizationMixin],
	  data: function data() {
	    return {
	      currentStepIndex: 0,
	      successfulCount: 0,
	      isSubmitting: false,
	      isCurrentStepValid: false,
	      validationAttempted: false,
	      mailboxesToConnect: [],
	      massConnectData: {},
	      steps: [ui_vue3.markRaw(ConnectionData), ui_vue3.markRaw(SelectEmployees), ui_vue3.markRaw(MailboxSettings)]
	    };
	  },
	  computed: _objectSpread$6(_objectSpread$6({}, ui_vue3_pinia.mapState(useWizardStore, ['analyticsSource'])), {}, {
	    isContinueButtonDisabled: function isContinueButtonDisabled() {
	      var _this$activeStepCompo;
	      var shouldDisable = (_this$activeStepCompo = this.activeStepComponent.disableButtonOnInvalid) !== null && _this$activeStepCompo !== void 0 ? _this$activeStepCompo : true;
	      return shouldDisable && !this.isCurrentStepValid;
	    },
	    totalSteps: function totalSteps() {
	      return this.steps.length;
	    },
	    activeStepComponent: function activeStepComponent() {
	      return this.steps[this.currentStepIndex];
	    },
	    isFirstStep: function isFirstStep() {
	      return this.currentStepIndex === 0;
	    },
	    isLastStep: function isLastStep() {
	      return this.currentStepIndex === this.totalSteps - 1;
	    },
	    isSecondStep: function isSecondStep() {
	      return this.currentStepIndex === 1;
	    }
	  }),
	  watch: {
	    currentStepIndex: function currentStepIndex() {
	      this.validationAttempted = false;
	    }
	  },
	  mounted: function mounted() {
	    ui_analytics.sendData({
	      tool: 'mail',
	      event: 'mailbox_mass_open',
	      category: 'mail_mass_ops',
	      c_section: this.analyticsSource
	    });
	  },
	  methods: {
	    nextStep: function nextStep() {
	      var _this = this;
	      this.validationAttempted = true;
	      this.$nextTick(function () {
	        if (_this.isCurrentStepValid && !_this.isLastStep) {
	          _this.handleStepCompletion();
	          _this.currentStepIndex++;
	        }
	      });
	    },
	    prevStep: function prevStep() {
	      if (!this.isFirstStep) {
	        this.currentStepIndex--;
	      }
	    },
	    submitWizard: function submitWizard() {
	      var _this2 = this;
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$3().mark(function _callee() {
	        var wizardStore, prepareData;
	        return _regeneratorRuntime$3().wrap(function _callee$(_context) {
	          while (1) switch (_context.prev = _context.next) {
	            case 0:
	              _this2.handleStepCompletion();
	              wizardStore = useWizardStore();
	              prepareData = wizardStore.prepareDataForBackend();
	              _this2.mailboxesToConnect = prepareData.mailboxes;
	              _this2.massConnectData = wizardStore.prepareDataForHistory();
	              if (!(_this2.mailboxesToConnect.length === 0)) {
	                _context.next = 7;
	                break;
	              }
	              return _context.abrupt("return");
	            case 7:
	              _this2.isSubmitting = true;
	            case 8:
	            case "end":
	              return _context.stop();
	          }
	        }, _callee);
	      }))();
	    },
	    handleStepCompletion: function handleStepCompletion() {
	      if (this.$refs.activeComponent && main_core.Type.isFunction(this.$refs.activeComponent.onStepComplete)) {
	        this.$refs.activeComponent.onStepComplete();
	      }
	    },
	    handleFixErrors: function handleFixErrors(errorsFromBackend, successfulCount) {
	      this.successfulCount = successfulCount;
	      var wizardStore = useWizardStore();
	      wizardStore.enableErrorState(errorsFromBackend.length);
	      var userIdsWithErrors = new Set(errorsFromBackend.map(function (error) {
	        var _error$customData;
	        return (_error$customData = error.customData) === null || _error$customData === void 0 ? void 0 : _error$customData.userIdToConnect;
	      }));
	      var employeesWithErrors = wizardStore.employees.filter(function (employee) {
	        return userIdsWithErrors.has(employee.id);
	      }).map(function (employee) {
	        return _objectSpread$6(_objectSpread$6({}, employee), {}, {
	          password: ''
	        });
	      });
	      var addedEmployees = [].concat(babelHelpers.toConsumableArray(wizardStore.addedEmployees), babelHelpers.toConsumableArray(wizardStore.employees.filter(function (employee) {
	        return !userIdsWithErrors.has(employee.id);
	      }).map(function (employee) {
	        return _objectSpread$6(_objectSpread$6({}, employee), {}, {
	          password: ''
	        });
	      })));
	      wizardStore.setAddedEmployees(addedEmployees);
	      wizardStore.setEmployees(employeesWithErrors);
	      this.isSubmitting = false;
	      this.currentStepIndex = 1;
	    }
	  },
	  // language=Vue
	  template: "\n\t\t<div class=\"mail_massconnect__wizard_container\">\n\t\t\t<template v-if=\"!isSubmitting\">\n\t\t\t\t<WizardProgressBar\n\t\t\t\t\t:total-steps=\"totalSteps\"\n\t\t\t\t\t:current-step-index=\"currentStepIndex\"\n\t\t\t\t/>\n\n\t\t\t\t<WizardHint v-if=\"isFirstStep\"/>\n\n\t\t\t\t<div class=\"mail_massconnect__wizard_card\">\n\t\t\t\t\t<div class=\"mail_massconnect__wizard_card_content\">\n\t\t\t\t\t\t<component\n\t\t\t\t\t\t\tref=\"activeComponent\"\n\t\t\t\t\t\t\t:is=\"activeStepComponent\"\n\t\t\t\t\t\t\t:validationAttempted=\"validationAttempted\"\n\t\t\t\t\t\t\t@update:validity=\"isCurrentStepValid = $event\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\n\t\t\t\t<WizardNavigation\n\t\t\t\t\t:isFirstStep=\"isFirstStep\"\n\t\t\t\t\t:isLastStep=\"isLastStep\"\n\t\t\t\t\t:isSubmitting=\"isSubmitting\"\n\t\t\t\t\t:prevDisabled=\"isSecondStep && successfulCount > 0\"\n\t\t\t\t\t:disabledContinueButton=\"isContinueButtonDisabled\"\n\t\t\t\t\t@prev-step=\"prevStep\"\n\t\t\t\t\t@next-step=\"nextStep\"\n\t\t\t\t\t@submit=\"submitWizard\"\n\t\t\t\t/>\n\t\t\t</template>\n\n\t\t\t<template v-else>\n\t\t\t\t<div class=\"mail_massconnect__wizard_connection_status_container\">\n\t\t\t\t\t<div class=\"mail_massconnect__wizard_connection_status_content\">\n\t\t\t\t\t\t<ConnectionStatus\n\t\t\t\t\t\t\t:mailboxes=\"mailboxesToConnect\"\n\t\t\t\t\t\t\t:massConnectData=\"massConnectData\"\n\t\t\t\t\t\t\t@fixErrors=\"handleFixErrors\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</template>\n\t\t</div>\n\t"
	};

	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	var _application = /*#__PURE__*/new WeakMap();
	var MassconnectForm = /*#__PURE__*/function () {
	  function MassconnectForm() {
	    var _options$isSmtpAvaila;
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    babelHelpers.classCallCheck(this, MassconnectForm);
	    _classPrivateFieldInitSpec(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.defineProperty(this, "source", null);
	    babelHelpers.defineProperty(this, "isSmtpAvailable", false);
	    babelHelpers.defineProperty(this, "permissions", {
	      allowedLevels: null,
	      canEditCrmIntegration: null
	    });
	    this.rootNode = document.querySelector("#".concat(options.appContainerId));
	    this.source = options === null || options === void 0 ? void 0 : options.source;
	    this.isSmtpAvailable = (_options$isSmtpAvaila = options.isSmtpAvailable) !== null && _options$isSmtpAvaila !== void 0 ? _options$isSmtpAvaila : false;
	    if (options !== null && options !== void 0 && options.permissions) {
	      this.permissions = options.permissions;
	    }
	  }
	  babelHelpers.createClass(MassconnectForm, [{
	    key: "start",
	    value: function start() {
	      var pinia = ui_vue3_pinia.createPinia();
	      babelHelpers.classPrivateFieldSet(this, _application, ui_vue3.BitrixVue.createApp({
	        components: {
	          WizardContainer: WizardContainer
	        },
	        // language=Vue
	        template: '<WizardContainer />'
	      }));
	      babelHelpers.classPrivateFieldGet(this, _application).use(pinia);
	      var wizardStore = useWizardStore();
	      wizardStore.setAnalyticsSource(this.source);
	      wizardStore.setSmtpStatus(this.isSmtpAvailable);
	      wizardStore.setPermissions(this.permissions);
	      babelHelpers.classPrivateFieldGet(this, _application).mount(this.rootNode);
	    }
	  }]);
	  return MassconnectForm;
	}();

	exports.MassconnectForm = MassconnectForm;

}((this.BX.Mail.Massconnect = this.BX.Mail.Massconnect || {}),BX.Vue3,BX.UI.System.Input,BX.UI.System.Input.Vue,BX,BX.UI.Vue3.Components,BX.UI,BX.UI.IconSet,BX.Mail,BX.Vue3.Directives,BX.UI.EntitySelector,BX.UI.Vue3.Components,BX.UI,BX,BX.Vue3.Components,BX.Vue3.Pinia,BX.UI.Analytics));
//# sourceMappingURL=massconnect-form.bundle.js.map
