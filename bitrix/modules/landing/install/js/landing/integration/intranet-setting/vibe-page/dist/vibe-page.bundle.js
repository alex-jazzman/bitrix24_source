/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Integration = this.BX.Landing.Integration || {};
(function (exports,landing_metrika,main_core,main_core_events,main_popup,ui_buttons,ui_icon_set,ui_section,ui_formElements_field) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8,
	  _t9,
	  _t10,
	  _t11,
	  _t12,
	  _t13,
	  _t14,
	  _t15,
	  _t16,
	  _t17,
	  _t18,
	  _t19,
	  _t20,
	  _t21,
	  _t22;
	var _iconDefaultSet = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("iconDefaultSet");
	var _iconDefaultIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("iconDefaultIcon");
	var _title = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("title");
	var _pageTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pageTitle");
	var _moduleId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("moduleId");
	var _embedId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("embedId");
	var _previewImg = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previewImg");
	var _isMainVibe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isMainVibe");
	var _icon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("icon");
	var _isPageExists = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isPageExists");
	var _isPublished = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isPublished");
	var _canEdit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canEdit");
	var _limitCode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("limitCode");
	var _urlCreate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("urlCreate");
	var _urlEdit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("urlEdit");
	var _urlPublic = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("urlPublic");
	var _urlPartners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("urlPartners");
	var _urlImport = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("urlImport");
	var _urlExport = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("urlExport");
	var _feedbackParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("feedbackParams");
	var _buttonEdit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttonEdit");
	var _buttonPartners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttonPartners");
	var _buttonMarket = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttonMarket");
	var _buttonWithdraw = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttonWithdraw");
	var _buttonPublish = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttonPublish");
	var _mainTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mainTemplate");
	var _secondaryTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("secondaryTemplate");
	var _buttonMainSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttonMainSettings");
	var _buttonSecondarySettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttonSecondarySettings");
	var _importPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("importPopup");
	var _exportPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("exportPopup");
	var _popupShare = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popupShare");
	var _popupWithdraw = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popupWithdraw");
	var _getMainTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMainTemplate");
	var _getSecondaryTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSecondaryTemplate");
	var _getButtonMainSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonMainSettings");
	var _getButtonSecondarySettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonSecondarySettings");
	var _showImportPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showImportPopup");
	var _showExportPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showExportPopup");
	var _showImportSlider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showImportSlider");
	var _showExportSlider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showExportSlider");
	var _showSharePopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSharePopup");
	var _showWithdrawPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showWithdrawPopup");
	var _getButtonEdit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonEdit");
	var _getButtonPublish = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonPublish");
	var _getButtonWithdraw = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonWithdraw");
	var _getButtonPartners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonPartners");
	var _getButtonCreate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButtonCreate");
	var _bindButtonEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindButtonEvents");
	var _bindSliderCloseEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindSliderCloseEvent");
	var _getAnalyticContextParam = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAnalyticContextParam");
	var _sendAnalytic = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendAnalytic");
	class VibeSection extends main_core_events.EventEmitter {
	  constructor(options) {
	    var _options$isMainVibe, _options$canEdit, _options$isPageExists, _options$isPublished;
	    super();
	    Object.defineProperty(this, _sendAnalytic, {
	      value: _sendAnalytic2
	    });
	    Object.defineProperty(this, _getAnalyticContextParam, {
	      value: _getAnalyticContextParam2
	    });
	    Object.defineProperty(this, _bindSliderCloseEvent, {
	      value: _bindSliderCloseEvent2
	    });
	    Object.defineProperty(this, _bindButtonEvents, {
	      value: _bindButtonEvents2
	    });
	    Object.defineProperty(this, _getButtonCreate, {
	      value: _getButtonCreate2
	    });
	    Object.defineProperty(this, _getButtonPartners, {
	      value: _getButtonPartners2
	    });
	    Object.defineProperty(this, _getButtonWithdraw, {
	      value: _getButtonWithdraw2
	    });
	    Object.defineProperty(this, _getButtonPublish, {
	      value: _getButtonPublish2
	    });
	    Object.defineProperty(this, _getButtonEdit, {
	      value: _getButtonEdit2
	    });
	    Object.defineProperty(this, _showWithdrawPopup, {
	      value: _showWithdrawPopup2
	    });
	    Object.defineProperty(this, _showSharePopup, {
	      value: _showSharePopup2
	    });
	    Object.defineProperty(this, _showExportSlider, {
	      value: _showExportSlider2
	    });
	    Object.defineProperty(this, _showImportSlider, {
	      value: _showImportSlider2
	    });
	    Object.defineProperty(this, _showExportPopup, {
	      value: _showExportPopup2
	    });
	    Object.defineProperty(this, _showImportPopup, {
	      value: _showImportPopup2
	    });
	    Object.defineProperty(this, _getButtonSecondarySettings, {
	      value: _getButtonSecondarySettings2
	    });
	    Object.defineProperty(this, _getButtonMainSettings, {
	      value: _getButtonMainSettings2
	    });
	    Object.defineProperty(this, _getSecondaryTemplate, {
	      value: _getSecondaryTemplate2
	    });
	    Object.defineProperty(this, _getMainTemplate, {
	      value: _getMainTemplate2
	    });
	    Object.defineProperty(this, _title, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _pageTitle, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _moduleId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _embedId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _previewImg, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isMainVibe, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _icon, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _isPageExists, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isPublished, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _canEdit, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _limitCode, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _urlCreate, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _urlEdit, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _urlPublic, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _urlPartners, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _urlImport, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _urlExport, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _feedbackParams, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttonEdit, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttonPartners, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttonMarket, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttonWithdraw, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttonPublish, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _mainTemplate, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _secondaryTemplate, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttonMainSettings, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttonSecondarySettings, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _importPopup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _exportPopup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _popupShare, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _popupWithdraw, {
	      writable: true,
	      value: null
	    });
	    this.setEventNamespace('BX.Landing.Vibe.IntranetSettings');
	    babelHelpers.classPrivateFieldLooseBase(this, _title)[_title] = options.title || '';
	    babelHelpers.classPrivateFieldLooseBase(this, _pageTitle)[_pageTitle] = options.pageTitle || babelHelpers.classPrivateFieldLooseBase(this, _title)[_title];
	    babelHelpers.classPrivateFieldLooseBase(this, _moduleId)[_moduleId] = options.moduleId || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _embedId)[_embedId] = options.embedId || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _isMainVibe)[_isMainVibe] = (_options$isMainVibe = options.isMainVibe) != null ? _options$isMainVibe : false;
	    babelHelpers.classPrivateFieldLooseBase(this, _previewImg)[_previewImg] = options.previewImg || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon] = main_core.Type.isObject(options.icon) ? options.icon : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] = (_options$canEdit = options.canEdit) != null ? _options$canEdit : false;
	    babelHelpers.classPrivateFieldLooseBase(this, _limitCode)[_limitCode] = options.limitCode || 'limit_office_vibe';
	    babelHelpers.classPrivateFieldLooseBase(this, _isPageExists)[_isPageExists] = (_options$isPageExists = options.isPageExists) != null ? _options$isPageExists : false;
	    babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished] = (_options$isPublished = options.isPublished) != null ? _options$isPublished : false;
	    babelHelpers.classPrivateFieldLooseBase(this, _urlCreate)[_urlCreate] = options.urlCreate || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _urlEdit)[_urlEdit] = options.urlEdit || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _urlPublic)[_urlPublic] = options.urlPublic || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _urlPartners)[_urlPartners] = options.urlPartners || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _urlImport)[_urlImport] = options.urlImport || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _urlExport)[_urlExport] = options.urlExport || null;
	    babelHelpers.classPrivateFieldLooseBase(this, _feedbackParams)[_feedbackParams] = options.feedbackParams || null;
	  }
	  getType() {
	    return 'welcome';
	  }
	  appendSections(contentNode) {
	    var _ref;
	    const set = babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon] && babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon].set ? `ui.icon-set.${babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon].set}` : babelHelpers.classPrivateFieldLooseBase(VibeSection, _iconDefaultSet)[_iconDefaultSet];
	    main_core.Runtime.loadExtension(set);
	    const iconClass = (_ref = babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon] && babelHelpers.classPrivateFieldLooseBase(this, _icon)[_icon].code) != null ? _ref : babelHelpers.classPrivateFieldLooseBase(VibeSection, _iconDefaultIcon)[_iconDefaultIcon];
	    const section = new ui_section.Section({
	      title: babelHelpers.classPrivateFieldLooseBase(this, _title)[_title],
	      titleIconClasses: `ui-icon-set ${iconClass}`,
	      canCollapse: !babelHelpers.classPrivateFieldLooseBase(this, _isMainVibe)[_isMainVibe]

	      // todo: bannerCode, isEnable
	    });

	    const mainSection = new ui_formElements_field.SettingsSection({
	      parent: this,
	      title: 'check',
	      titleIconClasses: 'ui-icon-set --feed-bold',
	      section
	    });
	    const secondarySection = new ui_formElements_field.SettingsSection({
	      parent: this,
	      section
	    });
	    const content = main_core.Tag.render(_t || (_t = _`
			<div>
				${0}		
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getMainTemplate)[_getMainTemplate]());
	    mainSection.getSectionView().append(new ui_section.Row({
	      content
	    }).render());
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isPageExists)[_isPageExists]) {
	      const secondaryContent = main_core.Tag.render(_t2 || (_t2 = _`
				<div>
					${0}			
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getSecondaryTemplate)[_getSecondaryTemplate]());
	      secondarySection.getSectionView().append(new ui_section.Row({
	        content: secondaryContent
	      }).render());
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _bindButtonEvents)[_bindButtonEvents]();
	    babelHelpers.classPrivateFieldLooseBase(this, _bindSliderCloseEvent)[_bindSliderCloseEvent]();
	    secondarySection.renderTo(contentNode);
	    mainSection.renderTo(contentNode);
	  }
	  getInfoTemplate() {
	    this.infoTemplate = main_core.Tag.render(_t3 || (_t3 = _`
			<div class="intranet-settings__vibe-info">
				<div class="intranet-settings__vibe-info-title">
					${0}
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${0}
					<div class="ui-icon-set --help intranet-settings__vibe-info-help"></div>
				</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_TITLE'), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUBTITLE'));
	    main_core.Event.bind(this.infoTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseenter', event => {
	      const width = this.infoTemplate.querySelector('.intranet-settings__vibe-info-help').offsetWidth;
	      this.warningHintPopup = new main_popup.Popup({
	        angle: true,
	        autoHide: true,
	        content: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_WARNING'),
	        cacheable: false,
	        animation: 'fading-slide',
	        bindElement: event.target,
	        offsetTop: 0,
	        offsetLeft: parseInt(width / 2, 10),
	        bindOptions: {
	          position: 'top'
	        },
	        darkMode: true
	      });
	      this.warningHintPopup.show();
	    });
	    main_core.Event.bind(this.infoTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseleave', () => {
	      if (this.warningHintPopup) {
	        setTimeout(() => {
	          this.warningHintPopup.destroy();
	          this.warningHintPopup = null;
	        }, 300);
	      }
	    });
	    return this.infoTemplate;
	  }
	  getInfoSuccessTemplate() {
	    this.infoSuccessTemplate = main_core.Tag.render(_t4 || (_t4 = _`
			<div class="intranet-settings__vibe-info --success">
				<div class="intranet-settings__vibe-info-title">
					${0}				
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${0}
					<div class="ui-icon-set --help intranet-settings__vibe-info-help"></div>
				</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_TITLE'), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_SUBTITLE'));
	    main_core.Event.bind(this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseenter', event => {
	      const width = this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help').offsetWidth;
	      this.successHintPopup = new main_popup.Popup({
	        angle: true,
	        autoHide: true,
	        content: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_SUCCESS'),
	        cacheable: false,
	        animation: 'fading-slide',
	        bindElement: event.target,
	        offsetTop: 0,
	        offsetLeft: parseInt(width / 2, 10),
	        bindOptions: {
	          position: 'top'
	        },
	        darkMode: true
	      });
	      this.successHintPopup.show();
	    });
	    main_core.Event.bind(this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseleave', () => {
	      if (this.successHintPopup) {
	        setTimeout(() => {
	          this.successHintPopup.destroy();
	          this.successHintPopup = null;
	        }, 300);
	      }
	    });
	    return this.infoSuccessTemplate;
	  }
	  renderLockElement() {
	    return main_core.Tag.render(_t5 || (_t5 = _`<span class="intranet-settings-mp-icon ui-icon-set --lock"></span>`));
	  }
	}
	function _getMainTemplate2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _mainTemplate)[_mainTemplate]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _mainTemplate)[_mainTemplate] = main_core.Tag.render(_t6 || (_t6 = _`
				<div class="intranet-settings__vibe-template">
					<div class="intranet-settings__vibe-icon-box">
						<div class="intranet-settings__vibe-icon"></div>
					</div>
					<div class="intranet-settings__vibe-content">
						<ul class="intranet-settings__vibe-list">
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${0}
								</div>																																
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${0}
								</div>								
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${0}
								</div>
							</li>
						</ul>
						<div class="intranet-settings__vibe-button-box">
							${0}
							<div class="intranet-settings__vibe-button-box-right">
								${0}
								${0}
							</div>
						</div>
					</div>
				</div>
			`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_1'), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_2'), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_3'), babelHelpers.classPrivateFieldLooseBase(this, _getButtonCreate)[_getButtonCreate](), babelHelpers.classPrivateFieldLooseBase(this, _getButtonPartners)[_getButtonPartners](), babelHelpers.classPrivateFieldLooseBase(this, _getButtonMainSettings)[_getButtonMainSettings]());
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _mainTemplate)[_mainTemplate];
	}
	function _getSecondaryTemplate2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _secondaryTemplate)[_secondaryTemplate]) {
	    var _babelHelpers$classPr;
	    const previewImg = babelHelpers.classPrivateFieldLooseBase(this, _previewImg)[_previewImg] ? main_core.Tag.render(_t7 || (_t7 = _`
					<img 
						src="${0}"
						class="intranet-settings__vibe-preview" 
					/>
				`), babelHelpers.classPrivateFieldLooseBase(this, _previewImg)[_previewImg]) : '';
	    babelHelpers.classPrivateFieldLooseBase(this, _secondaryTemplate)[_secondaryTemplate] = main_core.Tag.render(_t8 || (_t8 = _`
				<div class="intranet-settings__vibe-template --secondary-template">
					<div class="intranet-settings__vibe-preview-box">
						${0}
					</div>
					<div class="intranet-settings__vibe-content">
						<div class="intranet-settings__vibe-title">
							${0}
						</div>
						<div class="intranet-settings__vibe-info-template">
							${0}
						</div>					
						<div class="intranet-settings__vibe-button-box">
							${0}
							<div class="intranet-settings__vibe-button-box-right">
								${0}
								${0}
							</div>
						</div>
					</div>
				</div>			
			`), previewImg, (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _pageTitle)[_pageTitle]) != null ? _babelHelpers$classPr : '', babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished] ? this.getInfoSuccessTemplate() : this.getInfoTemplate(), babelHelpers.classPrivateFieldLooseBase(this, _getButtonEdit)[_getButtonEdit](), babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished] ? babelHelpers.classPrivateFieldLooseBase(this, _getButtonWithdraw)[_getButtonWithdraw]() : babelHelpers.classPrivateFieldLooseBase(this, _getButtonPublish)[_getButtonPublish](), babelHelpers.classPrivateFieldLooseBase(this, _getButtonSecondarySettings)[_getButtonSecondarySettings]());
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _secondaryTemplate)[_secondaryTemplate];
	}
	function _getButtonMainSettings2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _buttonMainSettings)[_buttonMainSettings]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _buttonMainSettings)[_buttonMainSettings] = main_core.Tag.render(_t9 || (_t9 = _`
				<button class="intranet-settings-btn-settings">
					<div class="ui-icon-set --more"></div>
				</button>
			`));
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _buttonMainSettings)[_buttonMainSettings];
	}
	function _getButtonSecondarySettings2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _buttonSecondarySettings)[_buttonSecondarySettings]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _buttonSecondarySettings)[_buttonSecondarySettings] = main_core.Tag.render(_t10 || (_t10 = _`
				<button class="intranet-settings-btn-settings">
					<div class="ui-icon-set --more"></div>
				</button>
			`));
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _buttonSecondarySettings)[_buttonSecondarySettings];
	}
	function _showImportPopup2() {
	  var _babelHelpers$classPr2;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _importPopup)[_importPopup]) {
	    const htmlContent = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? main_core.Tag.render(_t11 || (_t11 = _`<span>${0}</span>`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP')) : main_core.Tag.render(_t12 || (_t12 = _`
					<span class="intranet-settings-vibe-popup-item">
						${0} ${0}
					</span>
				`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP'), this.renderLockElement());
	    babelHelpers.classPrivateFieldLooseBase(this, _importPopup)[_importPopup] = new main_popup.Menu({
	      angle: true,
	      animation: 'fading-slide',
	      bindElement: babelHelpers.classPrivateFieldLooseBase(this, _buttonMainSettings)[_buttonMainSettings],
	      className: babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? '' : '--disabled',
	      items: [{
	        id: 'importPopup',
	        html: htmlContent,
	        onclick: babelHelpers.classPrivateFieldLooseBase(this, _showImportSlider)[_showImportSlider].bind(this)
	      }],
	      offsetLeft: 20,
	      events: {
	        onPopupClose: () => {},
	        onPopupShow: () => {}
	      }
	    });
	  }
	  (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _importPopup)[_importPopup]) == null ? void 0 : _babelHelpers$classPr2.show();
	}
	function _showExportPopup2() {
	  var _babelHelpers$classPr3;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _exportPopup)[_exportPopup]) {
	    const htmlContent = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? main_core.Tag.render(_t13 || (_t13 = _`<span>${0}</span>`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')) : main_core.Tag.render(_t14 || (_t14 = _`
					<span class="intranet-settings-vibe-popup-item --disabled">
						${0} ${0}
					</span>
				`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP'), this.renderLockElement());
	    babelHelpers.classPrivateFieldLooseBase(this, _exportPopup)[_exportPopup] = new main_popup.Menu({
	      angle: true,
	      animation: 'fading-slide',
	      bindElement: babelHelpers.classPrivateFieldLooseBase(this, _buttonSecondarySettings)[_buttonSecondarySettings],
	      className: babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? '' : '--disabled',
	      items: [{
	        id: 'exportPopup',
	        html: htmlContent,
	        onclick: babelHelpers.classPrivateFieldLooseBase(this, _showExportSlider)[_showExportSlider].bind(this)
	      }],
	      offsetLeft: 20,
	      events: {
	        onPopupClose: () => {},
	        onPopupShow: () => {}
	      }
	    });
	  }
	  (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _exportPopup)[_exportPopup]) == null ? void 0 : _babelHelpers$classPr3.show();
	}
	function _showImportSlider2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit]) {
	    BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _limitCode)[_limitCode]);
	    return;
	  }
	  if (main_core.Type.isUndefined(BX.SidePanel) || !babelHelpers.classPrivateFieldLooseBase(this, _urlImport)[_urlImport]) {
	    return;
	  }
	  const onOK = () => {
	    BX.SidePanel.Instance.open(babelHelpers.classPrivateFieldLooseBase(this, _urlImport)[_urlImport], {
	      width: 491,
	      allowChangeHistory: false,
	      cacheable: false,
	      data: {
	        rightBoundary: 0
	      }
	    });
	  };
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isPageExists)[_isPageExists]) {
	    onOK();
	    return;
	  }
	  BX.Runtime.loadExtension('ui.dialogs.messagebox').then(() => {
	    const messageBox = new BX.UI.Dialogs.MessageBox({
	      message: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_MESSAGE'),
	      title: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_TITLE'),
	      buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
	      okCaption: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_OK_BUTTON'),
	      cancelCaption: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_CANCEL_BUTTON'),
	      onOk: () => {
	        onOK();
	        return true;
	      },
	      onCancel: () => {
	        return true;
	      }
	    });
	    messageBox.show();
	    if (messageBox.popupWindow && messageBox.popupWindow.popupContainer) {
	      messageBox.popupWindow.popupContainer.classList.add('intranet-settings__vibe-popup');
	    }
	  });
	}
	function _showExportSlider2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit]) {
	    BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _limitCode)[_limitCode]);
	    return;
	  }
	  if (main_core.Type.isUndefined(BX.SidePanel) || !babelHelpers.classPrivateFieldLooseBase(this, _urlExport)[_urlExport]) {
	    return;
	  }
	  BX.SidePanel.Instance.open(babelHelpers.classPrivateFieldLooseBase(this, _urlExport)[_urlExport], {
	    width: 491,
	    allowChangeHistory: false,
	    cacheable: false,
	    data: {
	      rightBoundary: 0
	    }
	  });
	}
	function _showSharePopup2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _popupShare)[_popupShare]) {
	    var _babelHelpers$classPr4;
	    (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _popupShare)[_popupShare]) == null ? void 0 : _babelHelpers$classPr4.show();
	  } else {
	    var _babelHelpers$classPr5;
	    babelHelpers.classPrivateFieldLooseBase(this, _popupShare)[_popupShare] = new main_popup.Popup({
	      titleBar: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_TITLE_MSGVER_1'),
	      content: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_CONTENT'),
	      width: 350,
	      closeIcon: true,
	      closeByEsc: true,
	      animation: 'fading-slide',
	      buttons: [new ui_buttons.Button({
	        text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_BTN_CONFIRM'),
	        color: ui_buttons.Button.Color.PRIMARY,
	        onclick: () => {
	          const newTemplate = this.getInfoSuccessTemplate();
	          const wrapper = babelHelpers.classPrivateFieldLooseBase(this, _secondaryTemplate)[_secondaryTemplate].querySelector('.intranet-settings__vibe-info-template');
	          const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info:not(.--success)');
	          main_core.Dom.replace(innerWrapper, newTemplate);
	          main_core.ajax.runAction('landing.vibe.publish', {
	            data: {
	              moduleId: babelHelpers.classPrivateFieldLooseBase(this, _moduleId)[_moduleId],
	              embedId: babelHelpers.classPrivateFieldLooseBase(this, _embedId)[_embedId]
	            }
	          }).then(() => {
	            this.emit('publish');
	            if (babelHelpers.classPrivateFieldLooseBase(this, _urlPublic)[_urlPublic]) {
	              babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished] = true;
	            }
	          });
	          babelHelpers.classPrivateFieldLooseBase(this, _popupShare)[_popupShare].close();
	          babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytic)[_sendAnalytic]({
	            event: 'publish_page'
	          });
	        }
	      }), new ui_buttons.Button({
	        text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
	        color: ui_buttons.Button.Color.LIGHT_BORDER,
	        onclick: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _popupShare)[_popupShare].close();
	        }
	      })],
	      events: {
	        onClose: () => {}
	      }
	    });
	    (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _popupShare)[_popupShare]) == null ? void 0 : _babelHelpers$classPr5.show();
	  }
	}
	function _showWithdrawPopup2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _popupWithdraw)[_popupWithdraw]) {
	    var _babelHelpers$classPr6;
	    (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _popupWithdraw)[_popupWithdraw]) == null ? void 0 : _babelHelpers$classPr6.show();
	  } else {
	    var _babelHelpers$classPr7;
	    const title = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE') : main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE_FREE');
	    const content = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT') : main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT_FREE');
	    const okText = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM') : main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM_FREE');
	    babelHelpers.classPrivateFieldLooseBase(this, _popupWithdraw)[_popupWithdraw] = new main_popup.Popup({
	      titleBar: title,
	      content,
	      width: 350,
	      closeIcon: true,
	      closeByEsc: true,
	      animation: 'fading-slide',
	      buttons: [new ui_buttons.Button({
	        text: okText,
	        color: ui_buttons.Button.Color.DANGER_DARK,
	        onclick: () => {
	          const newTemplate = this.getInfoTemplate();
	          const wrapper = babelHelpers.classPrivateFieldLooseBase(this, _secondaryTemplate)[_secondaryTemplate].querySelector('.intranet-settings__vibe-info-template');
	          const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info');
	          main_core.Dom.replace(innerWrapper, newTemplate);
	          main_core.ajax.runAction('landing.vibe.withdraw', {
	            data: {
	              moduleId: babelHelpers.classPrivateFieldLooseBase(this, _moduleId)[_moduleId],
	              embedId: babelHelpers.classPrivateFieldLooseBase(this, _embedId)[_embedId]
	            }
	          }).then(() => {
	            this.emit('withdraw');
	            babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished] = false;
	          });
	          babelHelpers.classPrivateFieldLooseBase(this, _popupWithdraw)[_popupWithdraw].close();
	          babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytic)[_sendAnalytic]({
	            event: 'unpublish_page'
	          });
	        }
	      }), new ui_buttons.Button({
	        text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
	        color: ui_buttons.Button.Color.LIGHT_BORDER,
	        onclick: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _popupWithdraw)[_popupWithdraw].close();
	        }
	      })],
	      events: {
	        onClose: () => {}
	      }
	    });
	    (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _popupWithdraw)[_popupWithdraw]) == null ? void 0 : _babelHelpers$classPr7.show();
	  }
	}
	function _getButtonEdit2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _urlEdit)[_urlEdit]) {
	    return null;
	  }
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _buttonEdit)[_buttonEdit]) {
	    const buttonEdit = main_core.Tag.render(_t15 || (_t15 = _`
			
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue">
					${0}
				</button>
			`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT'));
	    const buttonEditLock = main_core.Tag.render(_t16 || (_t16 = _`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue --disabled">
					${0}
					${0}
				</button>
			`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT'), this.renderLockElement());
	    babelHelpers.classPrivateFieldLooseBase(this, _buttonEdit)[_buttonEdit] = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? buttonEdit : buttonEditLock;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _buttonEdit)[_buttonEdit];
	}
	function _getButtonPublish2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _buttonPublish)[_buttonPublish]) {
	    const renderNode = main_core.Tag.render(_t17 || (_t17 = _`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${0}">
					${0}
				</button>
			`), babelHelpers.classPrivateFieldLooseBase(this, _isPageExists)[_isPageExists] ? 'ui-btn-primary' : '--light-blue', main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC'));
	    const renderNodeLock = main_core.Tag.render(_t18 || (_t18 = _`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --disabled
						${0}">
					${0}
					${0}
				</button>
			`), babelHelpers.classPrivateFieldLooseBase(this, _isPageExists)[_isPageExists] ? 'ui-btn-primary' : '--light-blue', main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC'), this.renderLockElement());
	    babelHelpers.classPrivateFieldLooseBase(this, _buttonPublish)[_buttonPublish] = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? renderNode : renderNodeLock;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _buttonPublish)[_buttonPublish];
	}
	function _getButtonWithdraw2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _buttonWithdraw)[_buttonWithdraw]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _buttonWithdraw)[_buttonWithdraw] = main_core.Tag.render(_t19 || (_t19 = _`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${0}">
					${0}
				</button>
			`), babelHelpers.classPrivateFieldLooseBase(this, _isPageExists)[_isPageExists] ? 'ui-btn-primary' : '--light-blue', main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_UNPUBLIC'));
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _buttonWithdraw)[_buttonWithdraw];
	}
	function _getButtonPartners2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _feedbackParams)[_feedbackParams]) {
	    return null;
	  }
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _buttonPartners)[_buttonPartners]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _buttonPartners)[_buttonPartners] = main_core.Tag.render(_t20 || (_t20 = _`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-gray">
					${0}
				</button>
			`), main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS'));
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _buttonPartners)[_buttonPartners];
	}
	function _getButtonCreate2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _urlCreate)[_urlCreate]) {
	    return null;
	  }
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _buttonMarket)[_buttonMarket]) {
	    const buttonColor = babelHelpers.classPrivateFieldLooseBase(this, _isPageExists)[_isPageExists] ? '--light-blue' : 'ui-btn-primary';
	    const renderNode = main_core.Tag.render(_t21 || (_t21 = _`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${0}">
					${0}
				</button>
			`), buttonColor, main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET'));
	    const renderNodeLock = main_core.Tag.render(_t22 || (_t22 = _`
				<button class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${0} --disabled">
					${0}
					${0}
				</button>
			`), buttonColor, main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET'), this.renderLockElement());
	    babelHelpers.classPrivateFieldLooseBase(this, _buttonMarket)[_buttonMarket] = babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? renderNode : renderNodeLock;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _buttonMarket)[_buttonMarket];
	}
	function _bindButtonEvents2() {
	  if (main_core.Type.isUndefined(BX.SidePanel)) {
	    return;
	  }
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getButtonMainSettings)[_getButtonMainSettings](), 'click', babelHelpers.classPrivateFieldLooseBase(this, _showImportPopup)[_showImportPopup].bind(this));
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getButtonSecondarySettings)[_getButtonSecondarySettings](), 'click', babelHelpers.classPrivateFieldLooseBase(this, _showExportPopup)[_showExportPopup].bind(this));
	  if (babelHelpers.classPrivateFieldLooseBase(this, _getButtonCreate)[_getButtonCreate]()) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getButtonCreate)[_getButtonCreate](), 'click', () => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit]) {
	        BX.SidePanel.Instance.open(babelHelpers.classPrivateFieldLooseBase(this, _urlCreate)[_urlCreate]);
	      } else {
	        BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _limitCode)[_limitCode]);
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytic)[_sendAnalytic]({
	        event: 'open_market',
	        status: babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? 'success' : 'error_limit',
	        p2: babelHelpers.classPrivateFieldLooseBase(this, _getAnalyticContextParam)[_getAnalyticContextParam]()
	      });
	    });
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _getButtonEdit)[_getButtonEdit]()) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getButtonEdit)[_getButtonEdit](), 'click', () => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit]) {
	        BX.SidePanel.Instance.open(babelHelpers.classPrivateFieldLooseBase(this, _urlEdit)[_urlEdit], {
	          customLeftBoundary: 66,
	          events: {
	            onCloseComplete: () => {
	              if (babelHelpers.classPrivateFieldLooseBase(this, _urlPublic)[_urlPublic]) {
	                window.top.location = babelHelpers.classPrivateFieldLooseBase(this, _urlPublic)[_urlPublic];
	              }
	            }
	          }
	        });
	      } else {
	        BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _limitCode)[_limitCode]);
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytic)[_sendAnalytic]({
	        event: 'open_editor',
	        status: babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit] ? 'success' : 'error_limit'
	      });
	    });
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _getButtonPartners)[_getButtonPartners]()) {
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getButtonPartners)[_getButtonPartners](), 'click', () => {
	      // todo: need analitycs?

	      main_core.Runtime.loadExtension('ui.feedback.form').then(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _feedbackParams)[_feedbackParams].title = main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS');
	        BX.UI.Feedback.Form.open(babelHelpers.classPrivateFieldLooseBase(this, _feedbackParams)[_feedbackParams]);
	      });
	    });
	  }
	  this.subscribe('publish', () => {
	    main_core.Dom.replace(babelHelpers.classPrivateFieldLooseBase(this, _getButtonPublish)[_getButtonPublish](), babelHelpers.classPrivateFieldLooseBase(this, _getButtonWithdraw)[_getButtonWithdraw]());
	  });
	  this.subscribe('withdraw', () => {
	    main_core.Dom.replace(babelHelpers.classPrivateFieldLooseBase(this, _getButtonWithdraw)[_getButtonWithdraw](), babelHelpers.classPrivateFieldLooseBase(this, _getButtonPublish)[_getButtonPublish]());
	  });
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getButtonPublish)[_getButtonPublish](), 'click', () => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _canEdit)[_canEdit]) {
	      BX.UI.InfoHelper.show(babelHelpers.classPrivateFieldLooseBase(this, _limitCode)[_limitCode]);
	      babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytic)[_sendAnalytic]({
	        event: 'publish_page',
	        status: 'error_limit'
	      });
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _showSharePopup)[_showSharePopup]();
	  });
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _getButtonWithdraw)[_getButtonWithdraw](), 'click', babelHelpers.classPrivateFieldLooseBase(this, _showWithdrawPopup)[_showWithdrawPopup].bind(this));
	}
	function _bindSliderCloseEvent2() {
	  const isPublishedBefore = babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished];
	  main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onClose', () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished] !== isPublishedBefore) {
	      const location = babelHelpers.classPrivateFieldLooseBase(this, _isPublished)[_isPublished] ? babelHelpers.classPrivateFieldLooseBase(this, _urlPublic)[_urlPublic] : '/';
	      window.top.location = location;
	    }
	  });
	}
	function _getAnalyticContextParam2() {
	  return ['chapter', `${babelHelpers.classPrivateFieldLooseBase(this, _moduleId)[_moduleId]}-${babelHelpers.classPrivateFieldLooseBase(this, _embedId)[_embedId]}`];
	}
	function _sendAnalytic2(data) {
	  this.emit('sendAnalytic', data);
	}
	Object.defineProperty(VibeSection, _iconDefaultSet, {
	  writable: true,
	  value: 'ui.icon-set.main'
	});
	Object.defineProperty(VibeSection, _iconDefaultIcon, {
	  writable: true,
	  value: '--home'
	});

	var _metrika = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("metrika");
	var _sendAnalytic$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendAnalytic");
	class VibePage extends ui_formElements_field.BaseSettingsPage {
	  constructor() {
	    super();
	    Object.defineProperty(this, _sendAnalytic$1, {
	      value: _sendAnalytic2$1
	    });
	    this.titlePage = '';
	    this.descriptionPage = '';
	    Object.defineProperty(this, _metrika, {
	      writable: true,
	      value: void 0
	    });
	    this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_WELCOME');
	    this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_DESCRIPTION_PAGE_VIBE');
	    babelHelpers.classPrivateFieldLooseBase(this, _metrika)[_metrika] = new landing_metrika.Metrika(true, 'vibe');
	  }
	  getType() {
	    return 'welcome';
	  }
	  appendSections(contentNode) {
	    var _this$getAnalytic;
	    let subSection = 'from_settings';
	    const analyticContext = (_this$getAnalytic = this.getAnalytic()) == null ? void 0 : _this$getAnalytic.getContext();
	    if (main_core.Type.isString(analyticContext.analyticContext) && analyticContext.analyticContext === 'widget_settings_settings') {
	      subSection = 'from_widget_vibe_point';
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytic$1)[_sendAnalytic$1]({
	      event: 'open_settings_main',
	      c_sub_section: subSection
	    });
	    const vibes = this.getValue('vibes') || [];
	    vibes.forEach(options => {
	      const vibeSection = new VibeSection(options);
	      vibeSection.subscribe('sendAnalytic', event => {
	        babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytic$1)[_sendAnalytic$1](event.getData());
	      });
	      vibeSection.appendSections(contentNode);
	    });
	  }
	}
	function _sendAnalytic2$1(data) {
	  if (!main_core.Type.isString(data.event)) {
	    return;
	  }
	  data.category = 'vibe';
	  babelHelpers.classPrivateFieldLooseBase(this, _metrika)[_metrika].sendData(data);
	}

	main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onExternalPageLoaded:welcome', () => {
	  return new VibePage();
	});

}((this.BX.Landing.Integration['Intranet-setting'] = this.BX.Landing.Integration['Intranet-setting'] || {}),BX.Landing,BX,BX.Event,BX.Main,BX.UI,BX,BX.UI,BX.UI.FormElements));
//# sourceMappingURL=vibe-page.bundle.js.map
