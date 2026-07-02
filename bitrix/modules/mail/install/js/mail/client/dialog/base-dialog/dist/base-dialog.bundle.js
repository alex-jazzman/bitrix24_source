/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports,main_core,main_popup,ui_buttons) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5;
	const ActionPosition = {
	  center: 'center',
	  left: 'left'
	};
	const ContentPosition = {
	  center: 'center',
	  left: 'left'
	};
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _bodyElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bodyElement");
	var _headerElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("headerElement");
	var _titleElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("titleElement");
	var _contentContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("contentContainer");
	var _actionsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("actionsContainer");
	var _buttons = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buttons");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _createPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createPopup");
	class BaseDialog {
	  constructor(options = {}) {
	    var _options$id, _options$title, _options$width, _options$cacheable;
	    Object.defineProperty(this, _createPopup, {
	      value: _createPopup2
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bodyElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _headerElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _titleElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _contentContainer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _actionsContainer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _buttons, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = {
	      id: (_options$id = options.id) != null ? _options$id : 'mail-client-dialog',
	      title: (_options$title = options.title) != null ? _options$title : '',
	      width: (_options$width = options.width) != null ? _options$width : 490,
	      cacheable: (_options$cacheable = options.cacheable) != null ? _options$cacheable : false
	    };
	  }
	  show() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].destroy();
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = null;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = babelHelpers.classPrivateFieldLooseBase(this, _createPopup)[_createPopup]();
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	  }
	  close() {
	    var _babelHelpers$classPr;
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr.close();
	  }
	  getPopup() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup];
	  }
	  setContent(node) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer]) {
	      var _babelHelpers$classPr2;
	      main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer]);
	      main_core.Dom.append(node, babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer]);
	      (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr2.adjustPosition();
	    }
	  }
	  setContentAlign(align) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer]) {
	      return;
	    }
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer], 'mail__client_dialog_base-dialog_content--center');
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer], 'mail__client_dialog_base-dialog_content--left');
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer], `mail__client_dialog_base-dialog_content--${align}`);
	  }
	  setActions(configuration) {
	    var _configuration$positi;
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer]);
	    babelHelpers.classPrivateFieldLooseBase(this, _buttons)[_buttons].clear();
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer].parentNode) {
	      main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer], babelHelpers.classPrivateFieldLooseBase(this, _bodyElement)[_bodyElement]);
	    }
	    this.setActionsAlign((_configuration$positi = configuration.position) != null ? _configuration$positi : ActionPosition.left);
	    configuration.actions.forEach(action => {
	      const button = new ui_buttons.Button({
	        text: action.text,
	        style: action.style,
	        size: ui_buttons.ButtonSize.LARGE,
	        useAirDesign: true,
	        onclick: action.onclick
	      });
	      if (action.id) {
	        babelHelpers.classPrivateFieldLooseBase(this, _buttons)[_buttons].set(action.id, button);
	      }
	      main_core.Dom.append(button.render(), babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer]);
	    });
	  }
	  setActionsAlign(align) {
	    babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer].className = 'mail__client_dialog_base-dialog_actions';
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer], `mail__client_dialog_base-dialog_actions--${align}`);
	  }
	  hideActions() {
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer]);
	    babelHelpers.classPrivateFieldLooseBase(this, _buttons)[_buttons].clear();
	  }
	  setTitle(title) {
	    if ((title == null ? void 0 : title.length) > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _titleElement)[_titleElement].textContent = title;
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _headerElement)[_headerElement].parentNode) {
	        main_core.Dom.prepend(babelHelpers.classPrivateFieldLooseBase(this, _headerElement)[_headerElement], babelHelpers.classPrivateFieldLooseBase(this, _bodyElement)[_bodyElement]);
	      }
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _titleElement)[_titleElement].textContent = '';
	      main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _headerElement)[_headerElement]);
	    }
	  }
	  setBodyPadding(padding) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _bodyElement)[_bodyElement]) {
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _bodyElement)[_bodyElement], 'padding', padding);
	    }
	  }
	  setWidth(width) {
	    var _babelHelpers$classPr3;
	    (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr3.setWidth(width);
	  }
	  showCloseIcon() {
	    var _babelHelpers$classPr4;
	    if ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) != null && _babelHelpers$classPr4.closeIcon) {
	      main_core.Dom.show(babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].closeIcon);
	    }
	  }
	  hideCloseIcon() {
	    var _babelHelpers$classPr5;
	    if ((_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) != null && _babelHelpers$classPr5.closeIcon) {
	      main_core.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].closeIcon);
	    }
	  }
	  getButton(id) {
	    var _babelHelpers$classPr6;
	    return (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _buttons)[_buttons].get(id)) != null ? _babelHelpers$classPr6 : null;
	  }
	  onClose() {
	    // override in subclass
	  }
	}
	function _createPopup2() {
	  var _popup$overlay;
	  babelHelpers.classPrivateFieldLooseBase(this, _titleElement)[_titleElement] = main_core.Tag.render(_t || (_t = _`
			<span class="mail__client_dialog_base-dialog_title">
				${0}
			</span>
		`), babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].title);
	  babelHelpers.classPrivateFieldLooseBase(this, _headerElement)[_headerElement] = main_core.Tag.render(_t2 || (_t2 = _`
			<div class="mail__client_dialog_base-dialog_header">
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _titleElement)[_titleElement]);
	  babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer] = main_core.Tag.render(_t3 || (_t3 = _`
			<div class="mail__client_dialog_base-dialog_content"></div>
		`));
	  babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer] = main_core.Tag.render(_t4 || (_t4 = _`
			<div class="mail__client_dialog_base-dialog_actions"></div>
		`));
	  babelHelpers.classPrivateFieldLooseBase(this, _bodyElement)[_bodyElement] = main_core.Tag.render(_t5 || (_t5 = _`
			<div class="mail__client_dialog_base-dialog_body">
				${0}
				${0}
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _headerElement)[_headerElement], babelHelpers.classPrivateFieldLooseBase(this, _contentContainer)[_contentContainer], babelHelpers.classPrivateFieldLooseBase(this, _actionsContainer)[_actionsContainer]);
	  const popup = main_popup.PopupManager.create({
	    id: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].id,
	    className: 'mail__client_dialog_base-dialog --ui-context-content-light',
	    content: babelHelpers.classPrivateFieldLooseBase(this, _bodyElement)[_bodyElement],
	    closeIcon: true,
	    closeIconSize: main_popup.CloseIconSize.LARGE,
	    closeByEsc: true,
	    overlay: true,
	    cacheable: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].cacheable,
	    width: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].width,
	    borderRadius: 18,
	    contentPadding: 0,
	    padding: 0,
	    events: {
	      onClose: () => {
	        var _babelHelpers$classPr7;
	        (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr7.destroy();
	        babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = null;
	        this.onClose();
	      }
	    }
	  });
	  if ((_popup$overlay = popup.overlay) != null && _popup$overlay.element) {
	    main_core.Event.bind(popup.overlay.element, 'click', () => this.close());
	  }
	  return popup;
	}

	exports.ActionPosition = ActionPosition;
	exports.ContentPosition = ContentPosition;
	exports.BaseDialog = BaseDialog;

}((this.BX.Mail.Client.Dialog = this.BX.Mail.Client.Dialog || {}),BX,BX.Main,BX.UI));
//# sourceMappingURL=base-dialog.bundle.js.map
