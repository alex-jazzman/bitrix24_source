/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports,crm_entitySelector,main_core_events,ui_designTokens,ui_entitySelector,ui_notification,ui_progressbar,crm_common,main_popup,ui_buttons,main_core) {
	'use strict';

	var _menu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("menu");
	var _bindElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _isTextItemFirst = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isTextItemFirst");
	var _onEditorItemClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onEditorItemClick");
	var _onTextItemClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onTextItemClick");
	var _getMenuPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMenuPopup");
	var _getItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItems");
	var _getEditorItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEditorItem");
	var _getTextItem = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTextItem");
	var _getItemTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getItemTitle");
	class MenuPopup {
	  constructor({
	    bindElement,
	    isTextItemFirst,
	    onEditorItemClick,
	    onTextItemClick
	  }) {
	    Object.defineProperty(this, _getItemTitle, {
	      value: _getItemTitle2
	    });
	    Object.defineProperty(this, _getTextItem, {
	      value: _getTextItem2
	    });
	    Object.defineProperty(this, _getEditorItem, {
	      value: _getEditorItem2
	    });
	    Object.defineProperty(this, _getItems, {
	      value: _getItems2
	    });
	    Object.defineProperty(this, _getMenuPopup, {
	      value: _getMenuPopup2
	    });
	    Object.defineProperty(this, _menu, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bindElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _isTextItemFirst, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _onEditorItemClick, {
	      writable: true,
	      value: () => {}
	    });
	    Object.defineProperty(this, _onTextItemClick, {
	      writable: true,
	      value: () => {}
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement] = bindElement;
	    babelHelpers.classPrivateFieldLooseBase(this, _isTextItemFirst)[_isTextItemFirst] = isTextItemFirst;
	    babelHelpers.classPrivateFieldLooseBase(this, _onEditorItemClick)[_onEditorItemClick] = onEditorItemClick;
	    babelHelpers.classPrivateFieldLooseBase(this, _onTextItemClick)[_onTextItemClick] = onTextItemClick;
	  }
	  show() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getMenuPopup)[_getMenuPopup]().show();
	  }
	  destroy() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu]) == null ? void 0 : _babelHelpers$classPr.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu] = null;
	    main_core.Runtime.destroy(this);
	  }
	}
	function _getMenuPopup2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu] === null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu] = main_popup.MenuManager.create({
	      id: 'crm-template-editor-placeholder-selector',
	      bindElement: babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement],
	      autoHide: true,
	      offsetLeft: 20,
	      angle: true,
	      closeByEsc: false,
	      cacheable: false,
	      items: babelHelpers.classPrivateFieldLooseBase(this, _getItems)[_getItems]()
	    });
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu];
	}
	function _getItems2() {
	  const editorItem = babelHelpers.classPrivateFieldLooseBase(this, _getEditorItem)[_getEditorItem]();
	  const textItem = babelHelpers.classPrivateFieldLooseBase(this, _getTextItem)[_getTextItem]();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isTextItemFirst)[_isTextItemFirst]) {
	    return [textItem, editorItem];
	  }
	  return [editorItem, textItem];
	}
	function _getEditorItem2() {
	  return {
	    html: babelHelpers.classPrivateFieldLooseBase(this, _getItemTitle)[_getItemTitle]('CRM_TEMPLATE_EDITOR_SELECT_FIELD'),
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _onEditorItemClick)[_onEditorItemClick](babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement]);
	    }
	  };
	}
	function _getTextItem2() {
	  const code = babelHelpers.classPrivateFieldLooseBase(this, _isTextItemFirst)[_isTextItemFirst] ? 'CRM_TEMPLATE_EDITOR_UPDATE_TEXT' : 'CRM_TEMPLATE_EDITOR_CREATE_TEXT';
	  return {
	    html: babelHelpers.classPrivateFieldLooseBase(this, _getItemTitle)[_getItemTitle](code),
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _getMenuPopup)[_getMenuPopup]().close();
	      babelHelpers.classPrivateFieldLooseBase(this, _onTextItemClick)[_onTextItemClick](babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement]);
	    }
	  };
	}
	function _getItemTitle2(code) {
	  const placeholder = '<span class="crm-template-editor-placeholder-selector-menu-item">#ITEM_TEXT#</span>';
	  return placeholder.replace('#ITEM_TEXT#', main_core.Text.encode(main_core.Loc.getMessage(code)));
	}

	let _ = t => t,
	  _t,
	  _t2;
	const PREVIEW_POPUP_CONTENT_STATUS = {
	  LOADING: 1,
	  SUCCESS: 2,
	  FAILED: 3
	};
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _bindElement$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _previewContentContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previewContentContainer");
	var _previewLoader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previewLoader");
	var _entityTypeId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityTypeId");
	var _entityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _getPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	class PreviewPopup {
	  constructor(bindElement, entityTypeId, entityId) {
	    Object.defineProperty(this, _getContent, {
	      value: _getContent2
	    });
	    Object.defineProperty(this, _getPopup, {
	      value: _getPopup2
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bindElement$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _previewContentContainer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _previewLoader, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _entityTypeId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _entityId, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement$1)[_bindElement$1] = bindElement;
	    babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId)[_entityTypeId] = entityTypeId;
	    babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId] = entityId;
	  }
	  destroy() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]()) == null ? void 0 : _babelHelpers$classPr.destroy();
	  }
	  isShown() {
	    var _babelHelpers$classPr2, _babelHelpers$classPr3;
	    return (_babelHelpers$classPr2 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]()) == null ? void 0 : _babelHelpers$classPr3.isShown()) != null ? _babelHelpers$classPr2 : false;
	  }
	  show() {
	    var _babelHelpers$classPr4;
	    (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]()) == null ? void 0 : _babelHelpers$classPr4.show();
	  }
	  apply(status, data = '') {
	    const closeIconElement = babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().getPopupContainer().querySelector('.popup-window-close-icon');
	    switch (status) {
	      case PREVIEW_POPUP_CONTENT_STATUS.LOADING:
	        {
	          main_core.Dom.addClass(closeIconElement, '--hidden');
	          babelHelpers.classPrivateFieldLooseBase(this, _previewContentContainer)[_previewContentContainer].innerText = '';
	          if (!babelHelpers.classPrivateFieldLooseBase(this, _previewLoader)[_previewLoader]) {
	            babelHelpers.classPrivateFieldLooseBase(this, _previewLoader)[_previewLoader] = new ui_progressbar.ProgressBar({
	              color: ui_progressbar.ProgressBar.Color.PRIMARY,
	              size: 10,
	              maxValue: 100,
	              value: 30,
	              infiniteLoading: true
	            });
	          }
	          babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().setHeight(75);
	          babelHelpers.classPrivateFieldLooseBase(this, _previewLoader)[_previewLoader].renderTo(babelHelpers.classPrivateFieldLooseBase(this, _previewContentContainer)[_previewContentContainer]);
	          break;
	        }
	      case PREVIEW_POPUP_CONTENT_STATUS.SUCCESS:
	        {
	          babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().setHeight(null);
	          babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().setAutoHide(true);
	          babelHelpers.classPrivateFieldLooseBase(this, _previewContentContainer)[_previewContentContainer].innerText = data;
	          main_core.Dom.removeClass(closeIconElement, '--hidden');
	          main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _previewContentContainer)[_previewContentContainer], '--loaded');
	          break;
	        }
	      case PREVIEW_POPUP_CONTENT_STATUS.FAILED:
	        {
	          babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().destroy();
	          ui_notification.UI.Notification.Center.notify({
	            content: main_core.Text.encode(data),
	            autoHideDelay: 5000
	          });
	          break;
	        }
	      default:
	        throw new TypeError(`Unsupported preview popup content status ${status}`);
	    }
	  }
	}
	function _getPopup2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] === null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = main_popup.PopupWindowManager.create({
	      id: `crm-template-editor-preview-popup-${babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId)[_entityTypeId]}-${babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId]}`,
	      bindElement: babelHelpers.classPrivateFieldLooseBase(this, _bindElement$1)[_bindElement$1],
	      closeIcon: {
	        top: '10px'
	      },
	      cacheable: false,
	      closeByEsc: false,
	      autoHide: false,
	      angle: {
	        position: 'top',
	        offset: 70
	      },
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getContent)[_getContent]()
	    });
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup];
	}
	function _getContent2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _previewContentContainer)[_previewContentContainer] = main_core.Tag.render(_t || (_t = _`<div class="crm-template-editor-preview-popup-content"></div>`));
	  return main_core.Tag.render(_t2 || (_t2 = _`
			<div class="crm-template-editor-preview-popup-wrapper">
				<div class="crm-template-editor-preview-popup-title">
					${0}
				</div>
				${0}
			</div>
		`), main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_PREVIEW_POPUP_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _previewContentContainer)[_previewContentContainer]);
	}

	var _entityTypeId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityTypeId");
	var _entityId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _categoryId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("categoryId");
	var _bindElement$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _isDisplayFormat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDisplayFormat");
	var _isUsePreviewRequestRunning = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUsePreviewRequestRunning");
	var _previewCache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previewCache");
	var _previewPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previewPopup");
	var _unsubscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unsubscribe");
	class Previewer {
	  constructor(params) {
	    Object.defineProperty(this, _entityTypeId$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _entityId$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _categoryId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bindElement$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _isDisplayFormat, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _isUsePreviewRequestRunning, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _previewCache, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _previewPopup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _unsubscribe, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1] = main_core.Text.toInteger(params.entityTypeId);
	    if (!BX.CrmEntityType.isDefined(babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1])) {
	      throw new Error('Previewer: entityTypeId must be a valid entity type ID');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _entityId$1)[_entityId$1] = main_core.Text.toInteger(params.entityId);
	    if (params.entityId <= 0) {
	      throw new Error('Previewer: entityId must be greater than 0');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId] = main_core.Type.isNil(params.categoryId) ? null : main_core.Text.toInteger(params.categoryId);
	    if (!main_core.Type.isNil(babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId]) && babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId] < 0) {
	      throw new Error('Previewer: categoryId must be a non-negative integer');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement$2)[_bindElement$2] = main_core.Type.isDomNode(params.bindElement) ? params.bindElement : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _isDisplayFormat)[_isDisplayFormat] = main_core.Type.isBoolean(params.isDisplayFormat) ? params.isDisplayFormat : babelHelpers.classPrivateFieldLooseBase(this, _isDisplayFormat)[_isDisplayFormat];
	    babelHelpers.classPrivateFieldLooseBase(this, _unsubscribe)[_unsubscribe] = BX.Crm.EntityEvent.subscribeToItem(babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1], babelHelpers.classPrivateFieldLooseBase(this, _entityId$1)[_entityId$1], () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _previewCache)[_previewCache].clear();
	    });
	  }
	  preview(template, bindElement) {
	    var _babelHelpers$classPr, _babelHelpers$classPr3;
	    const bindElementToUse = main_core.Type.isDomNode(bindElement) ? bindElement : babelHelpers.classPrivateFieldLooseBase(this, _bindElement$2)[_bindElement$2];
	    if (!main_core.Type.isDomNode(bindElementToUse)) {
	      throw new Error('Previewer: bindElement must be a valid DOM element');
	    }
	    if ((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) != null && _babelHelpers$classPr.isShown()) {
	      return;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isUsePreviewRequestRunning)[_isUsePreviewRequestRunning]) {
	      var _babelHelpers$classPr2;
	      (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) == null ? void 0 : _babelHelpers$classPr2.show();
	      return;
	    }
	    (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) == null ? void 0 : _babelHelpers$classPr3.destroy();
	    const cachedPreview = babelHelpers.classPrivateFieldLooseBase(this, _previewCache)[_previewCache].get(template);
	    if (cachedPreview) {
	      babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup] = new PreviewPopup(bindElementToUse, babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1], babelHelpers.classPrivateFieldLooseBase(this, _entityId$1)[_entityId$1]);
	      babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup].apply(PREVIEW_POPUP_CONTENT_STATUS.SUCCESS, cachedPreview);
	      babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup].show();
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup] = new PreviewPopup(bindElementToUse, babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1], babelHelpers.classPrivateFieldLooseBase(this, _entityId$1)[_entityId$1]);
	    babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup].apply(PREVIEW_POPUP_CONTENT_STATUS.LOADING);
	    babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup].show();
	    babelHelpers.classPrivateFieldLooseBase(this, _isUsePreviewRequestRunning)[_isUsePreviewRequestRunning] = true;
	    main_core.ajax.runAction('crm.activity.smsplaceholder.preview', {
	      data: {
	        entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$1)[_entityTypeId$1],
	        entityId: babelHelpers.classPrivateFieldLooseBase(this, _entityId$1)[_entityId$1],
	        message: template,
	        entityCategoryId: babelHelpers.classPrivateFieldLooseBase(this, _categoryId)[_categoryId],
	        isDisplayFormat: babelHelpers.classPrivateFieldLooseBase(this, _isDisplayFormat)[_isDisplayFormat]
	      }
	    }).then(response => {
	      var _babelHelpers$classPr4;
	      (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) == null ? void 0 : _babelHelpers$classPr4.apply(PREVIEW_POPUP_CONTENT_STATUS.SUCCESS, response.data.preview);
	      babelHelpers.classPrivateFieldLooseBase(this, _isUsePreviewRequestRunning)[_isUsePreviewRequestRunning] = false;
	      babelHelpers.classPrivateFieldLooseBase(this, _previewCache)[_previewCache].set(template, response.data.preview);
	    }).catch(response => {
	      var _babelHelpers$classPr5, _response$errors$0$me;
	      (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) == null ? void 0 : _babelHelpers$classPr5.apply(PREVIEW_POPUP_CONTENT_STATUS.FAILED, (_response$errors$0$me = response.errors[0].message) != null ? _response$errors$0$me : 'Unknown error');
	      babelHelpers.classPrivateFieldLooseBase(this, _isUsePreviewRequestRunning)[_isUsePreviewRequestRunning] = false;
	    });
	  }
	  isShown() {
	    var _babelHelpers$classPr6, _babelHelpers$classPr7;
	    return (_babelHelpers$classPr6 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) == null ? void 0 : _babelHelpers$classPr7.isShown()) != null ? _babelHelpers$classPr6 : false;
	  }
	  close() {
	    var _babelHelpers$classPr8;
	    babelHelpers.classPrivateFieldLooseBase(this, _isUsePreviewRequestRunning)[_isUsePreviewRequestRunning] = false;
	    (_babelHelpers$classPr8 = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) == null ? void 0 : _babelHelpers$classPr8.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup] = null;
	  }
	  destroy() {
	    var _babelHelpers$classPr9, _babelHelpers$classPr10, _babelHelpers$classPr11;
	    (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup]) == null ? void 0 : _babelHelpers$classPr9.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _previewPopup)[_previewPopup] = null;
	    (_babelHelpers$classPr10 = (_babelHelpers$classPr11 = babelHelpers.classPrivateFieldLooseBase(this, _unsubscribe))[_unsubscribe]) == null ? void 0 : _babelHelpers$classPr10.call(_babelHelpers$classPr11);
	    babelHelpers.classPrivateFieldLooseBase(this, _previewCache)[_previewCache] = null;
	    main_core.Runtime.destroy(this);
	  }
	}

	let _$1 = t => t,
	  _t$1,
	  _t2$1;
	var _popup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _input = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("input");
	var _bindElement$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _value = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("value");
	var _onApply = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onApply");
	var _getPopup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getContent$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	var _bindInputEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindInputEvents");
	var _getMenuButtons = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMenuButtons");
	var _getApplyButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getApplyButton");
	var _adjustButtonState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adjustButtonState");
	var _getApplyButtonText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getApplyButtonText");
	var _onApplyButtonClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onApplyButtonClick");
	var _getApplyButtonInstance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getApplyButtonInstance");
	var _getCancelButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCancelButton");
	var _setCursorToEnd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setCursorToEnd");
	class TextPopup {
	  constructor({
	    bindElement,
	    value: _value2,
	    onApply
	  }) {
	    Object.defineProperty(this, _setCursorToEnd, {
	      value: _setCursorToEnd2
	    });
	    Object.defineProperty(this, _getCancelButton, {
	      value: _getCancelButton2
	    });
	    Object.defineProperty(this, _getApplyButtonInstance, {
	      value: _getApplyButtonInstance2
	    });
	    Object.defineProperty(this, _onApplyButtonClick, {
	      value: _onApplyButtonClick2
	    });
	    Object.defineProperty(this, _getApplyButtonText, {
	      value: _getApplyButtonText2
	    });
	    Object.defineProperty(this, _adjustButtonState, {
	      value: _adjustButtonState2
	    });
	    Object.defineProperty(this, _getApplyButton, {
	      value: _getApplyButton2
	    });
	    Object.defineProperty(this, _getMenuButtons, {
	      value: _getMenuButtons2
	    });
	    Object.defineProperty(this, _bindInputEvents, {
	      value: _bindInputEvents2
	    });
	    Object.defineProperty(this, _getContent$1, {
	      value: _getContent2$1
	    });
	    Object.defineProperty(this, _getPopup$1, {
	      value: _getPopup2$1
	    });
	    Object.defineProperty(this, _popup$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _input, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bindElement$3, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _value, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onApply, {
	      writable: true,
	      value: () => {}
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement$3)[_bindElement$3] = bindElement;
	    babelHelpers.classPrivateFieldLooseBase(this, _value)[_value] = _value2;
	    babelHelpers.classPrivateFieldLooseBase(this, _onApply)[_onApply] = onApply;
	  }
	  destroy() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1]) == null ? void 0 : _babelHelpers$classPr.destroy();
	  }
	  show() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getPopup$1)[_getPopup$1]().show();
	  }
	}
	function _getPopup2$1() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1] === null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1] = main_popup.PopupWindowManager.create('crm-template-editor-text-popup', babelHelpers.classPrivateFieldLooseBase(this, _bindElement$3)[_bindElement$3], {
	      autoHide: true,
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getContent$1)[_getContent$1](),
	      closeByEsc: true,
	      closeIcon: false,
	      buttons: babelHelpers.classPrivateFieldLooseBase(this, _getMenuButtons)[_getMenuButtons](),
	      cacheable: false
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1].subscribe('onShow', () => {
	      // Give time for input to render before setting focus.
	      setTimeout(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].focus();
	        babelHelpers.classPrivateFieldLooseBase(this, _setCursorToEnd)[_setCursorToEnd]();
	      }, 0);
	    });
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1];
	}
	function _getContent2$1() {
	  const content = main_core.Tag.render(_t$1 || (_t$1 = _$1`<div class="crm-template-editor-text-popup-wrapper"></div>`));
	  babelHelpers.classPrivateFieldLooseBase(this, _input)[_input] = main_core.Tag.render(_t2$1 || (_t2$1 = _$1`
			<input 
				type="text" 
				value="${0}"
				maxlength="255"
				placeholder="${0}
			">
		`), main_core.Text.encode(babelHelpers.classPrivateFieldLooseBase(this, _value)[_value]), main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_SELECT_FIELD_PLACEHOLDER'));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _input)[_input], content);
	  babelHelpers.classPrivateFieldLooseBase(this, _bindInputEvents)[_bindInputEvents]();
	  return content;
	}
	function _bindInputEvents2() {
	  main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _input)[_input], 'keyup', event => {
	    const button = babelHelpers.classPrivateFieldLooseBase(this, _getApplyButtonInstance)[_getApplyButtonInstance]();
	    if (!button) {
	      return;
	    }
	    const {
	      value
	    } = event.target;
	    babelHelpers.classPrivateFieldLooseBase(this, _adjustButtonState)[_adjustButtonState](button, value);
	  });
	}
	function _getMenuButtons2() {
	  return [babelHelpers.classPrivateFieldLooseBase(this, _getApplyButton)[_getApplyButton](), babelHelpers.classPrivateFieldLooseBase(this, _getCancelButton)[_getCancelButton]()];
	}
	function _getApplyButton2() {
	  const button = new ui_buttons.Button({
	    id: 'apply-button',
	    text: babelHelpers.classPrivateFieldLooseBase(this, _getApplyButtonText)[_getApplyButtonText](),
	    className: 'ui-btn ui-btn-xs ui-btn-primary ui-btn-round',
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _onApplyButtonClick)[_onApplyButtonClick]();
	    }
	  });
	  const {
	    value
	  } = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input];
	  babelHelpers.classPrivateFieldLooseBase(this, _adjustButtonState)[_adjustButtonState](button, value);
	  return button;
	}
	function _adjustButtonState2(button, value) {
	  button.setState(main_core.Type.isStringFilled(value) && main_core.Type.isStringFilled(value.trim()) ? ui_buttons.ButtonState.ACTIVE : ui_buttons.ButtonState.DISABLED);
	}
	function _getApplyButtonText2() {
	  if (main_core.Type.isStringFilled(babelHelpers.classPrivateFieldLooseBase(this, _value)[_value])) {
	    return main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_TEXT_POPUP_UPDATE');
	  }
	  return main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_TEXT_POPUP_ADD');
	}
	function _onApplyButtonClick2() {
	  const button = babelHelpers.classPrivateFieldLooseBase(this, _getApplyButtonInstance)[_getApplyButtonInstance]();
	  if (button.getState() !== ui_buttons.ButtonState.ACTIVE) {
	    return;
	  }
	  this.destroy();
	  const {
	    value
	  } = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input];
	  babelHelpers.classPrivateFieldLooseBase(this, _bindElement$3)[_bindElement$3].textContent = main_core.Text.encode(value);
	  babelHelpers.classPrivateFieldLooseBase(this, _onApply)[_onApply](value.trim());
	}
	function _getApplyButtonInstance2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1].getButton('apply-button');
	}
	function _getCancelButton2() {
	  return new ui_buttons.Button({
	    text: main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_TEXT_POPUP_CANCEL'),
	    className: 'ui-btn ui-btn-xs ui-btn-light ui-btn-round',
	    onclick: () => {
	      this.destroy();
	    }
	  });
	}
	function _setCursorToEnd2() {
	  const {
	    length
	  } = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].value;
	  babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].selectionStart = length;
	  babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].selectionEnd = length;
	}

	function getPlainText(templateBody, placeholders, filledPlaceholders) {
	  let result = templateBody;
	  if (main_core.Type.isArrayFilled(filledPlaceholders)) {
	    filledPlaceholders.forEach(filledPlaceholder => {
	      if (main_core.Type.isStringFilled(filledPlaceholder.FIELD_NAME)) {
	        result = result.replace(filledPlaceholder.PLACEHOLDER_ID, `{${filledPlaceholder.FIELD_NAME}}`);
	      } else if (main_core.Type.isStringFilled(filledPlaceholder.FIELD_VALUE)) {
	        const fieldValue = filledPlaceholder.FIELD_VALUE.replaceAll('{', '&#123;').replaceAll('}', '&#125;');
	        result = result.replace(filledPlaceholder.PLACEHOLDER_ID, fieldValue);
	      }
	    });
	  }
	  if (main_core.Type.isArrayFilled(placeholders)) {
	    placeholders.forEach(placeholder => {
	      result = result.replace(placeholder, ' ');
	    });
	  }
	  return result;
	}

	let _$2 = t => t,
	  _t$2,
	  _t2$2,
	  _t3,
	  _t4,
	  _t5,
	  _t6;
	const UPDATE_ACTION = 'update';
	const DELETE_ACTION = 'delete';
	const HEADER_POSITION = 'HEADER';
	const PREVIEW_POSITION = 'PREVIEW';
	const FOOTER_POSITION = 'FOOTER';
	var _id = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("id");
	var _target = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("target");
	var _entityTypeId$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityTypeId");
	var _entityId$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _categoryId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("categoryId");
	var _canUseFieldsDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canUseFieldsDialog");
	var _canUseFieldValueInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canUseFieldValueInput");
	var _isReadOnly = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isReadOnly");
	var _previewer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("previewer");
	var _headerContainerEl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("headerContainerEl");
	var _bodyContainerEl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bodyContainerEl");
	var _footerContainerEl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("footerContainerEl");
	var _placeHoldersDialogDefaultOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("placeHoldersDialogDefaultOptions");
	var _headerRaw = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("headerRaw");
	var _bodyRaw = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bodyRaw");
	var _footerRaw = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("footerRaw");
	var _popupMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popupMenu");
	var _inputPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inputPopup");
	var _dialogsCache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialogsCache");
	var _createContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createContainer");
	var _createContainerWithSelectors = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createContainerWithSelectors");
	var _getDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDialog");
	var _onApplyInputPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onApplyInputPopup");
	var _onPreviewTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPreviewTemplate");
	var _getInputContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInputContainer");
	var _getPlaceholders = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPlaceholders");
	var _prepareDlgOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareDlgOptions");
	var _adjustFilledPlaceholders = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adjustFilledPlaceholders");
	var _deleteFromFilledPlaceholders = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteFromFilledPlaceholders");
	var _updateForFilledPlaceholders = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateForFilledPlaceholders");
	var _getFilledPlaceholderByElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilledPlaceholderByElement");
	var _getPlaceholderIdByElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPlaceholderIdByElement");
	var _getFilledPlaceholderById = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFilledPlaceholderById");
	var _getPlainText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPlainText");
	var _getRawTextByPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRawTextByPosition");
	var _assertValidParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("assertValidParams");
	var _canUsePlaceholderProvider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canUsePlaceholderProvider");
	class Editor {
	  // @todo replace this variables with a generic container

	  constructor(_params) {
	    var _params$canUseFieldsD, _params$canUseFieldVa, _params$isReadOnly, _params$canUsePreview;
	    Object.defineProperty(this, _canUsePlaceholderProvider, {
	      value: _canUsePlaceholderProvider2
	    });
	    Object.defineProperty(this, _assertValidParams, {
	      value: _assertValidParams2
	    });
	    Object.defineProperty(this, _getRawTextByPosition, {
	      value: _getRawTextByPosition2
	    });
	    Object.defineProperty(this, _getPlainText, {
	      value: _getPlainText2
	    });
	    Object.defineProperty(this, _getFilledPlaceholderById, {
	      value: _getFilledPlaceholderById2
	    });
	    Object.defineProperty(this, _getPlaceholderIdByElement, {
	      value: _getPlaceholderIdByElement2
	    });
	    Object.defineProperty(this, _getFilledPlaceholderByElement, {
	      value: _getFilledPlaceholderByElement2
	    });
	    Object.defineProperty(this, _updateForFilledPlaceholders, {
	      value: _updateForFilledPlaceholders2
	    });
	    Object.defineProperty(this, _deleteFromFilledPlaceholders, {
	      value: _deleteFromFilledPlaceholders2
	    });
	    Object.defineProperty(this, _adjustFilledPlaceholders, {
	      value: _adjustFilledPlaceholders2
	    });
	    Object.defineProperty(this, _prepareDlgOptions, {
	      value: _prepareDlgOptions2
	    });
	    Object.defineProperty(this, _getPlaceholders, {
	      value: _getPlaceholders2
	    });
	    Object.defineProperty(this, _getInputContainer, {
	      value: _getInputContainer2
	    });
	    Object.defineProperty(this, _onPreviewTemplate, {
	      value: _onPreviewTemplate2
	    });
	    Object.defineProperty(this, _onApplyInputPopup, {
	      value: _onApplyInputPopup2
	    });
	    Object.defineProperty(this, _getDialog, {
	      value: _getDialog2
	    });
	    Object.defineProperty(this, _createContainerWithSelectors, {
	      value: _createContainerWithSelectors2
	    });
	    Object.defineProperty(this, _createContainer, {
	      value: _createContainer2
	    });
	    Object.defineProperty(this, _id, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _target, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _entityTypeId$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _entityId$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _categoryId$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _canUseFieldsDialog, {
	      writable: true,
	      value: true
	    });
	    Object.defineProperty(this, _canUseFieldValueInput, {
	      writable: true,
	      value: true
	    });
	    Object.defineProperty(this, _isReadOnly, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _previewer, {
	      writable: true,
	      value: null
	    });
	    this.placeholders = [];
	    this.filledPlaceholders = [];
	    this.onSelect = () => {};
	    Object.defineProperty(this, _headerContainerEl, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bodyContainerEl, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _footerContainerEl, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _placeHoldersDialogDefaultOptions, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _headerRaw, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bodyRaw, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _footerRaw, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _popupMenu, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _inputPopup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _dialogsCache, {
	      writable: true,
	      value: new WeakMap()
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _assertValidParams)[_assertValidParams](_params);
	    babelHelpers.classPrivateFieldLooseBase(this, _id)[_id] = _params.id || `crm-template-editor-${main_core.Text.getRandom()}`;
	    babelHelpers.classPrivateFieldLooseBase(this, _target)[_target] = _params.target;
	    babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$2)[_entityTypeId$2] = _params.entityTypeId;
	    babelHelpers.classPrivateFieldLooseBase(this, _entityId$2)[_entityId$2] = _params.entityId;
	    babelHelpers.classPrivateFieldLooseBase(this, _categoryId$1)[_categoryId$1] = main_core.Type.isNumber(_params.categoryId) ? _params.categoryId : null;
	    this.onSelect = _params.onSelect;
	    babelHelpers.classPrivateFieldLooseBase(this, _canUseFieldsDialog)[_canUseFieldsDialog] = Boolean((_params$canUseFieldsD = _params.canUseFieldsDialog) != null ? _params$canUseFieldsD : true);
	    babelHelpers.classPrivateFieldLooseBase(this, _canUseFieldValueInput)[_canUseFieldValueInput] = Boolean((_params$canUseFieldVa = _params.canUseFieldValueInput) != null ? _params$canUseFieldVa : true);
	    babelHelpers.classPrivateFieldLooseBase(this, _isReadOnly)[_isReadOnly] = Boolean((_params$isReadOnly = _params.isReadOnly) != null ? _params$isReadOnly : false);
	    const canUsePreview = Boolean((_params$canUsePreview = _params.canUsePreview) != null ? _params$canUsePreview : false);
	    if (canUsePreview && babelHelpers.classPrivateFieldLooseBase(this, _entityId$2)[_entityId$2] > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _previewer)[_previewer] = new Previewer({
	        entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$2)[_entityTypeId$2],
	        entityId: babelHelpers.classPrivateFieldLooseBase(this, _entityId$2)[_entityId$2],
	        categoryId: babelHelpers.classPrivateFieldLooseBase(this, _categoryId$1)[_categoryId$1]
	      });
	    }
	    this.onPlaceholderClick = this.onPlaceholderClick.bind(this);
	    this.onShowInputPopup = this.onShowInputPopup.bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _placeHoldersDialogDefaultOptions)[_placeHoldersDialogDefaultOptions] = {
	      multiple: false,
	      showAvatars: false,
	      dropdownMode: true,
	      compactView: true,
	      enableSearch: true,
	      tagSelectorOptions: {
	        textBoxWidth: '100%'
	      }
	    };
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _isReadOnly)[_isReadOnly] && babelHelpers.classPrivateFieldLooseBase(this, _canUsePlaceholderProvider)[_canUsePlaceholderProvider](_params.usePlaceholderProvider)) {
	      var _babelHelpers$classPr;
	      babelHelpers.classPrivateFieldLooseBase(this, _placeHoldersDialogDefaultOptions)[_placeHoldersDialogDefaultOptions].entities = [{
	        id: 'placeholder',
	        options: {
	          entityTypeId: babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$2)[_entityTypeId$2],
	          entityId: babelHelpers.classPrivateFieldLooseBase(this, _entityId$2)[_entityId$2],
	          categoryId: (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _categoryId$1)[_categoryId$1]) != null ? _babelHelpers$classPr : null
	        }
	      }];
	    }
	    if (main_core.Type.isPlainObject(_params.dialogOptions)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _placeHoldersDialogDefaultOptions)[_placeHoldersDialogDefaultOptions] = {
	        ...babelHelpers.classPrivateFieldLooseBase(this, _placeHoldersDialogDefaultOptions)[_placeHoldersDialogDefaultOptions],
	        ..._params.dialogOptions
	      };
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _createContainer)[_createContainer]();
	  }
	  setPlaceholders(placeholders) {
	    this.placeholders = placeholders;
	    return this;
	  }
	  setFilledPlaceholders(filledPlaceholders) {
	    this.filledPlaceholders = filledPlaceholders;
	    return this;
	  }

	  // region Public methods
	  setHeader(input) {
	    if (!main_core.Type.isStringFilled(input)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _headerRaw)[_headerRaw] = input;
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _headerContainerEl)[_headerContainerEl]);
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _createContainerWithSelectors)[_createContainerWithSelectors](input), babelHelpers.classPrivateFieldLooseBase(this, _headerContainerEl)[_headerContainerEl]);
	  }
	  setBody(input) {
	    if (!main_core.Type.isStringFilled(input)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _bodyRaw)[_bodyRaw] = input;
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _bodyContainerEl)[_bodyContainerEl]);
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _createContainerWithSelectors)[_createContainerWithSelectors](input), babelHelpers.classPrivateFieldLooseBase(this, _bodyContainerEl)[_bodyContainerEl]);
	  }
	  setFooter(input) {
	    if (!main_core.Type.isStringFilled(input)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _footerRaw)[_footerRaw] = input;
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _footerContainerEl)[_footerContainerEl]);
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _createContainerWithSelectors)[_createContainerWithSelectors](input), babelHelpers.classPrivateFieldLooseBase(this, _footerContainerEl)[_footerContainerEl]);
	  }
	  getData() {
	    if (this.placeholders === null) {
	      return null;
	    }
	    return {
	      header: babelHelpers.classPrivateFieldLooseBase(this, _getPlainText)[_getPlainText](HEADER_POSITION),
	      body: babelHelpers.classPrivateFieldLooseBase(this, _getPlainText)[_getPlainText](PREVIEW_POSITION),
	      footer: babelHelpers.classPrivateFieldLooseBase(this, _getPlainText)[_getPlainText](FOOTER_POSITION)
	    };
	  }
	  getRawData() {
	    return {
	      header: babelHelpers.classPrivateFieldLooseBase(this, _headerRaw)[_headerRaw],
	      body: babelHelpers.classPrivateFieldLooseBase(this, _bodyRaw)[_bodyRaw],
	      footer: babelHelpers.classPrivateFieldLooseBase(this, _footerRaw)[_footerRaw]
	    };
	  }
	  destroy() {
	    var _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4;
	    (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _previewer)[_previewer]) == null ? void 0 : _babelHelpers$classPr2.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _previewer)[_previewer] = null;
	    (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _inputPopup)[_inputPopup]) == null ? void 0 : _babelHelpers$classPr3.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _inputPopup)[_inputPopup] = null;
	    (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _popupMenu)[_popupMenu]) == null ? void 0 : _babelHelpers$classPr4.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _popupMenu)[_popupMenu] = null;
	    main_core.Runtime.destroy(this);
	  }
	  // endregion

	  onPlaceholderClick({
	    dialogOptions,
	    event
	  }) {
	    var _babelHelpers$classPr5;
	    (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _inputPopup)[_inputPopup]) == null ? void 0 : _babelHelpers$classPr5.destroy();
	    const filledPlaceholder = babelHelpers.classPrivateFieldLooseBase(this, _getFilledPlaceholderByElement)[_getFilledPlaceholderByElement](event.target, PREVIEW_POSITION);
	    const isTextItemFirst = main_core.Type.isStringFilled(filledPlaceholder == null ? void 0 : filledPlaceholder.FIELD_VALUE);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _canUseFieldsDialog)[_canUseFieldsDialog] && babelHelpers.classPrivateFieldLooseBase(this, _canUseFieldValueInput)[_canUseFieldValueInput]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popupMenu)[_popupMenu] = new MenuPopup({
	        bindElement: event.target,
	        isTextItemFirst,
	        onEditorItemClick: () => {
	          this.onShowDialogPopup(filledPlaceholder, dialogOptions);
	        },
	        onTextItemClick: element => {
	          this.onShowInputPopup(element);
	        }
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _popupMenu)[_popupMenu].show();
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _canUseFieldsDialog)[_canUseFieldsDialog]) {
	      this.onShowDialogPopup(filledPlaceholder, dialogOptions);
	    } else if (babelHelpers.classPrivateFieldLooseBase(this, _canUseFieldValueInput)[_canUseFieldValueInput]) {
	      this.onShowInputPopup(event.target);
	    }
	  }
	  onShowDialogPopup(filledPlaceholder, dialogOptions) {
	    const dialog = babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogOptions);
	    if (main_core.Type.isStringFilled(filledPlaceholder == null ? void 0 : filledPlaceholder.FIELD_VALUE)) {
	      dialog.getPreselectedItems().forEach(preselectedItem => {
	        const item = dialog.getItem(preselectedItem);
	        if (item) {
	          item.deselect();
	        }
	      });
	    }
	    dialog.show();
	  }

	  /**
	   * Dialog with preselected items makes backend request on construction.
	   * Create dialog only when user clicks, and then cache it.
	   */

	  onShowInputPopup(bindElement) {
	    const filledPlaceholder = babelHelpers.classPrivateFieldLooseBase(this, _getFilledPlaceholderByElement)[_getFilledPlaceholderByElement](bindElement);
	    const value = main_core.Type.isStringFilled(filledPlaceholder == null ? void 0 : filledPlaceholder.FIELD_VALUE) ? filledPlaceholder.FIELD_VALUE : '';
	    babelHelpers.classPrivateFieldLooseBase(this, _inputPopup)[_inputPopup] = new TextPopup({
	      bindElement,
	      value,
	      onApply: newValue => {
	        babelHelpers.classPrivateFieldLooseBase(this, _onApplyInputPopup)[_onApplyInputPopup](newValue, bindElement);
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _inputPopup)[_inputPopup].show();
	  }
	}
	function _createContainer2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _target)[_target]) {
	    return;
	  }
	  const containerEl = main_core.Tag.render(_t$2 || (_t$2 = _$2`
			<div id="${0}" class="crm-template-editor crm-template-editor__scope"></div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _id)[_id]);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isReadOnly)[_isReadOnly]) {
	    main_core.Dom.addClass(containerEl, '--read-only');
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _headerContainerEl)[_headerContainerEl] = main_core.Tag.render(_t2$2 || (_t2$2 = _$2`<div class="crm-template-editor-header"></div>`));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _headerContainerEl)[_headerContainerEl], containerEl);
	  babelHelpers.classPrivateFieldLooseBase(this, _bodyContainerEl)[_bodyContainerEl] = main_core.Tag.render(_t3 || (_t3 = _$2`<div class="crm-template-editor-body"></div>`));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _bodyContainerEl)[_bodyContainerEl], containerEl);
	  babelHelpers.classPrivateFieldLooseBase(this, _footerContainerEl)[_footerContainerEl] = main_core.Tag.render(_t4 || (_t4 = _$2`<div class="crm-template-editor-footer"></div>`));
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _footerContainerEl)[_footerContainerEl], containerEl);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _previewer)[_previewer]) {
	    const previewLink = main_core.Tag.render(_t5 || (_t5 = _$2`
				<div class="crm-template-editor-preview-link" href="#">
					${0}
				</div>
			`), main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_PREVIEW_LINK_TITLE'));
	    main_core.Event.bind(previewLink, 'click', babelHelpers.classPrivateFieldLooseBase(this, _onPreviewTemplate)[_onPreviewTemplate].bind(this));
	    main_core.Dom.append(previewLink, containerEl);
	  }
	  main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _target)[_target]);
	  main_core.Dom.append(containerEl, babelHelpers.classPrivateFieldLooseBase(this, _target)[_target]);
	}
	function _createContainerWithSelectors2(input, position = PREVIEW_POSITION) {
	  const placeholders = babelHelpers.classPrivateFieldLooseBase(this, _getPlaceholders)[_getPlaceholders](position);
	  if (placeholders === null) {
	    return null;
	  }
	  const container = babelHelpers.classPrivateFieldLooseBase(this, _getInputContainer)[_getInputContainer](input, position);
	  placeholders.forEach((placeholder, key) => {
	    const element = [...container.childNodes].find(node => node.dataset && Number(node.dataset.templatePlaceholder) === key);
	    if (!element) {
	      return;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isReadOnly)[_isReadOnly]) {
	      return;
	    }
	    const dialogOptions = main_core.Runtime.clone(babelHelpers.classPrivateFieldLooseBase(this, _placeHoldersDialogDefaultOptions)[_placeHoldersDialogDefaultOptions]);
	    babelHelpers.classPrivateFieldLooseBase(this, _prepareDlgOptions)[_prepareDlgOptions](dialogOptions, element, position);
	    main_core.Event.bind(element, 'click', event => {
	      this.onPlaceholderClick({
	        dialogOptions,
	        event
	      });
	    });
	  });
	  return container;
	}
	function _getDialog2(dialogOptions) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _dialogsCache)[_dialogsCache].has(dialogOptions)) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _dialogsCache)[_dialogsCache].get(dialogOptions);
	  }
	  const dialog = new crm_entitySelector.Dialog(dialogOptions);
	  babelHelpers.classPrivateFieldLooseBase(this, _dialogsCache)[_dialogsCache].set(dialogOptions, dialog);
	  return dialog;
	}
	function _onApplyInputPopup2(value, bindElement) {
	  const placeholderId = babelHelpers.classPrivateFieldLooseBase(this, _getPlaceholderIdByElement)[_getPlaceholderIdByElement](bindElement, PREVIEW_POSITION);
	  const params = {
	    id: placeholderId,
	    parentTitle: null,
	    text: value,
	    title: value,
	    entityType: BX.CrmEntityType.resolveName(babelHelpers.classPrivateFieldLooseBase(this, _entityTypeId$2)[_entityTypeId$2]).toLowerCase()
	  };

	  // eslint-disable-next-line no-param-reassign
	  bindElement.textContent = value;
	  main_core.Dom.addClass(bindElement, '--selected');
	  babelHelpers.classPrivateFieldLooseBase(this, _adjustFilledPlaceholders)[_adjustFilledPlaceholders](params);
	  this.onSelect(params);
	}
	function _onPreviewTemplate2(event) {
	  const currentTemplate = this.placeholders === null ? this.getRawData().body : this.getData().body; // TODO: implement header and footer processing

	  babelHelpers.classPrivateFieldLooseBase(this, _previewer)[_previewer].preview(currentTemplate, event.target);
	  main_core_events.EventEmitter.emit('BX.Crm.Template.Editor:shown');
	}
	function _getInputContainer2(input, position) {
	  const placeholders = babelHelpers.classPrivateFieldLooseBase(this, _getPlaceholders)[_getPlaceholders](position);
	  if (placeholders === null) {
	    return null;
	  }
	  let i = 0;
	  placeholders.forEach(placeholder => {
	    const filledPlaceholder = babelHelpers.classPrivateFieldLooseBase(this, _getFilledPlaceholderById)[_getFilledPlaceholderById](placeholder);
	    let title = main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_EMPTY_PLACEHOLDER_LABEL');
	    let spanClass = 'crm-template-editor-element-pill';
	    if (filledPlaceholder) {
	      if (main_core.Type.isStringFilled(filledPlaceholder.PARENT_TITLE) && main_core.Type.isStringFilled(filledPlaceholder.TITLE)) {
	        title = `${filledPlaceholder.PARENT_TITLE}: ${filledPlaceholder.TITLE}`;
	      } else if (main_core.Type.isStringFilled(filledPlaceholder.TITLE)) {
	        title = filledPlaceholder.TITLE;
	      } else if (main_core.Type.isStringFilled(filledPlaceholder.FIELD_NAME)) {
	        title = filledPlaceholder.FIELD_NAME;
	      } else {
	        title = filledPlaceholder.FIELD_VALUE;
	      }
	      title = main_core.Text.encode(title);
	      spanClass += ' --selected';
	    }
	    const replaceValue = `<span class="${spanClass}" data-test-role="placeholder" data-template-placeholder="${i++}">${title}</span>`;

	    // eslint-disable-next-line no-param-reassign
	    input = input.replace(placeholder, replaceValue);
	  });
	  return main_core.Tag.render(_t6 || (_t6 = _$2`<div>${0}</div>`), input);
	}
	function _getPlaceholders2(position) {
	  const allPlaceholders = main_core.Type.isPlainObject(this.placeholders) ? this.placeholders : {};
	  const placeholders = main_core.Type.isArrayFilled(allPlaceholders[position]) ? allPlaceholders[position] : [];
	  return main_core.Type.isArrayLike(placeholders) ? placeholders : null;
	}
	function _prepareDlgOptions2(dlgOptions, element, position) {
	  var _placeholders$element;
	  const placeholders = babelHelpers.classPrivateFieldLooseBase(this, _getPlaceholders)[_getPlaceholders](position);
	  const placeholderId = (_placeholders$element = placeholders[element.dataset.templatePlaceholder]) != null ? _placeholders$element : null;
	  if (placeholderId) {
	    const filledPlaceholder = babelHelpers.classPrivateFieldLooseBase(this, _getFilledPlaceholderById)[_getFilledPlaceholderById](placeholderId);
	    if (filledPlaceholder) {
	      // eslint-disable-next-line no-param-reassign
	      dlgOptions.preselectedItems = [[filledPlaceholder.FIELD_ENTITY_TYPE, filledPlaceholder.FIELD_NAME]];
	    }
	  }

	  // eslint-disable-next-line no-param-reassign
	  dlgOptions.events = {
	    onShow: () => {
	      const keyframes = [{
	        transform: 'rotate(0)'
	      }, {
	        transform: 'rotate(90deg)'
	      }, {
	        transform: 'rotate(180deg)'
	      }];
	      const options = {
	        duration: 200,
	        pseudoElement: '::after'
	      };
	      element.animate(keyframes, options);
	      main_core.Dom.addClass(element, '--flipped');
	    },
	    onHide: () => {
	      const keyframes = [{
	        transform: 'rotate(180deg)'
	      }, {
	        transform: 'rotate(90deg)'
	      }, {
	        transform: 'rotate(0)'
	      }];
	      const options = {
	        duration: 200,
	        pseudoElement: '::after'
	      };
	      element.animate(keyframes, options);
	      main_core.Dom.removeClass(element, '--flipped');
	    },
	    'Item:onSelect': event => {
	      main_core.Dom.addClass(element, '--selected');
	      const item = event.getData().item;
	      const parentTitle = item.supertitle.text;
	      const title = item.title.text;

	      // eslint-disable-next-line no-param-reassign
	      element.textContent = `${parentTitle}: ${title}`;
	      const value = item.id;
	      const entityType = item.entityId;
	      const params = {
	        id: placeholderId,
	        value,
	        parentTitle,
	        title,
	        entityType
	      };
	      babelHelpers.classPrivateFieldLooseBase(this, _adjustFilledPlaceholders)[_adjustFilledPlaceholders](params);
	      this.onSelect(params);
	    }
	  };

	  // eslint-disable-next-line no-param-reassign
	  dlgOptions.targetNode = element;
	}
	function _adjustFilledPlaceholders2({
	  id,
	  value,
	  text,
	  parentTitle,
	  title
	}, action = UPDATE_ACTION) {
	  if (action === DELETE_ACTION) {
	    babelHelpers.classPrivateFieldLooseBase(this, _deleteFromFilledPlaceholders)[_deleteFromFilledPlaceholders](id, value);
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _updateForFilledPlaceholders)[_updateForFilledPlaceholders]({
	    id,
	    value,
	    text,
	    parentTitle,
	    title
	  });
	}
	function _deleteFromFilledPlaceholders2(id, value) {
	  this.filledPlaceholders = this.filledPlaceholders.filter(filledPlaceholder => {
	    return filledPlaceholder.PLACEHOLDER_ID !== id || filledPlaceholder.FIELD_NAME !== value;
	  });
	}
	function _updateForFilledPlaceholders2({
	  id,
	  value,
	  text,
	  parentTitle,
	  title
	}) {
	  const filledPlaceholder = babelHelpers.classPrivateFieldLooseBase(this, _getFilledPlaceholderById)[_getFilledPlaceholderById](id);
	  if (filledPlaceholder) {
	    filledPlaceholder.FIELD_NAME = value != null ? value : null;
	    filledPlaceholder.FIELD_VALUE = text != null ? text : null;
	    filledPlaceholder.PARENT_TITLE = parentTitle;
	    filledPlaceholder.TITLE = title;
	  } else {
	    this.filledPlaceholders.push({
	      PLACEHOLDER_ID: id,
	      FIELD_NAME: value,
	      FIELD_VALUE: text,
	      PARENT_TITLE: parentTitle,
	      TITLE: title
	    });
	  }
	}
	function _getFilledPlaceholderByElement2(element, position = PREVIEW_POSITION) {
	  const placeholderId = babelHelpers.classPrivateFieldLooseBase(this, _getPlaceholderIdByElement)[_getPlaceholderIdByElement](element, position);
	  return babelHelpers.classPrivateFieldLooseBase(this, _getFilledPlaceholderById)[_getFilledPlaceholderById](placeholderId);
	}
	function _getPlaceholderIdByElement2(element, position = PREVIEW_POSITION) {
	  var _placeholders$element2;
	  const placeholders = babelHelpers.classPrivateFieldLooseBase(this, _getPlaceholders)[_getPlaceholders](position);
	  return (_placeholders$element2 = placeholders[element.dataset.templatePlaceholder]) != null ? _placeholders$element2 : null;
	}
	function _getFilledPlaceholderById2(placeholderId) {
	  return this.filledPlaceholders.find(filledPlaceholderItem => filledPlaceholderItem.PLACEHOLDER_ID === placeholderId);
	}
	function _getPlainText2(position) {
	  const text = babelHelpers.classPrivateFieldLooseBase(this, _getRawTextByPosition)[_getRawTextByPosition](position);
	  if (text === null) {
	    return null;
	  }
	  return getPlainText(text, this.placeholders[position], this.filledPlaceholders);
	}
	function _getRawTextByPosition2(position) {
	  if (position === HEADER_POSITION) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _headerRaw)[_headerRaw];
	  }
	  if (position === PREVIEW_POSITION) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _bodyRaw)[_bodyRaw];
	  }
	  if (position === FOOTER_POSITION) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _footerRaw)[_footerRaw];
	  }
	  return null;
	}
	function _assertValidParams2(params) {
	  var _params$isReadOnly2;
	  if (!main_core.Type.isPlainObject(params)) {
	    throw new TypeError('BX.Crm.Template.Editor: The "params" argument must be object');
	  }
	  if (!main_core.Type.isDomNode(params.target)) {
	    throw new Error('BX.Crm.Template.Editor: The "target" argument must be DOM node');
	  }
	  const isReadOnly = Boolean((_params$isReadOnly2 = params.isReadOnly) != null ? _params$isReadOnly2 : false);
	  if (!isReadOnly && babelHelpers.classPrivateFieldLooseBase(this, _canUsePlaceholderProvider)[_canUsePlaceholderProvider](params.usePlaceholderProvider) && !BX.CrmEntityType.isDefined(params.entityTypeId)) {
	    throw new TypeError('BX.Crm.Template.Editor: The "entityTypeId" argument is not correct');
	  }
	  if (!isReadOnly && !main_core.Type.isFunction(params.onSelect)) {
	    throw new TypeError('BX.Crm.Template.Editor: The "onSelect" argument is not correct');
	  }
	}
	function _canUsePlaceholderProvider2(value) {
	  return main_core.Type.isNil(value) || value === true;
	}

	exports.Editor = Editor;
	exports.Previewer = Previewer;
	exports.getPlainText = getPlainText;

}((this.BX.Crm.Template = this.BX.Crm.Template || {}),BX.Crm.EntitySelectorEx,BX.Event,BX,BX.UI.EntitySelector,BX,BX.UI,BX,BX.Main,BX.UI,BX));
//# sourceMappingURL=editor.bundle.js.map
