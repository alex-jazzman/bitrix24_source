/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports,main_core,ui_buttons,ui_system_input,ui_confetti,mail_client_dialog_baseDialog) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	var _input = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("input");
	var _mailboxId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mailboxId");
	var _email = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("email");
	var _sending = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sending");
	var _messageListUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("messageListUrl");
	var _newMailboxId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("newMailboxId");
	var _renderForm = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderForm");
	var _onPasswordInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPasswordInput");
	var _showSuccess = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSuccess");
	var _fireConfetti = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fireConfetti");
	var _onSuccessClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSuccessClose");
	var _submit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("submit");
	var _decline = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("decline");
	class PasswordlessConnect extends mail_client_dialog_baseDialog.BaseDialog {
	  constructor(mailboxId, email, options = {}) {
	    var _options$messageListU;
	    super({
	      id: 'mail-passwordless-connect',
	      title: main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_POPUP_TITLE'),
	      width: 430
	    });
	    Object.defineProperty(this, _decline, {
	      value: _decline2
	    });
	    Object.defineProperty(this, _submit, {
	      value: _submit2
	    });
	    Object.defineProperty(this, _onSuccessClose, {
	      value: _onSuccessClose2
	    });
	    Object.defineProperty(this, _fireConfetti, {
	      value: _fireConfetti2
	    });
	    Object.defineProperty(this, _showSuccess, {
	      value: _showSuccess2
	    });
	    Object.defineProperty(this, _onPasswordInput, {
	      value: _onPasswordInput2
	    });
	    Object.defineProperty(this, _renderForm, {
	      value: _renderForm2
	    });
	    Object.defineProperty(this, _input, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _mailboxId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _email, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _sending, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _messageListUrl, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _newMailboxId, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _mailboxId)[_mailboxId] = mailboxId;
	    babelHelpers.classPrivateFieldLooseBase(this, _email)[_email] = email;
	    babelHelpers.classPrivateFieldLooseBase(this, _messageListUrl)[_messageListUrl] = (_options$messageListU = options.messageListUrl) != null ? _options$messageListU : '';
	  }
	  show() {
	    super.show();
	    babelHelpers.classPrivateFieldLooseBase(this, _renderForm)[_renderForm]();
	  }
	  static checkAndShow(options = {}) {
	    main_core.ajax.runAction('mail.mailboxconnecting.getPendingPasswordlessRequest').then(response => {
	      var _response$data;
	      if ((_response$data = response.data) != null && _response$data.mailboxId) {
	        const popup = new PasswordlessConnect(response.data.mailboxId, response.data.email, options);
	        popup.show();
	      }
	    }).catch(() => {});
	  }
	}
	function _renderForm2() {
	  var _parts$, _this$getButton;
	  babelHelpers.classPrivateFieldLooseBase(this, _input)[_input] = new ui_system_input.Input({
	    placeholder: main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_PASSWORD_PLACEHOLDER'),
	    type: 'password',
	    stretched: true,
	    onInput: () => babelHelpers.classPrivateFieldLooseBase(this, _onPasswordInput)[_onPasswordInput]()
	  });
	  const descriptionText = main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_DESCRIPTION');
	  const parts = descriptionText.split('#EMAIL#');
	  this.setContent(main_core.Tag.render(_t || (_t = _`
			<div class="mail__client_dialog_passwordless-connect_form">
				<div class="mail__client_dialog_base-dialog_content-description">
					${0}<span class="mail__client_dialog_passwordless-connect_email-link">${0}</span>${0}
				</div>
				${0}
			</div>
		`), parts[0], babelHelpers.classPrivateFieldLooseBase(this, _email)[_email], (_parts$ = parts[1]) != null ? _parts$ : '', babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].render()));
	  this.setActions({
	    position: mail_client_dialog_baseDialog.ActionPosition.left,
	    actions: [{
	      id: 'submit',
	      text: main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_SUBMIT'),
	      style: ui_buttons.AirButtonStyle.FILLED,
	      onclick: () => babelHelpers.classPrivateFieldLooseBase(this, _submit)[_submit]()
	    }, {
	      id: 'decline',
	      text: main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_DECLINE'),
	      style: ui_buttons.AirButtonStyle.OUTLINE,
	      onclick: () => babelHelpers.classPrivateFieldLooseBase(this, _decline)[_decline]()
	    }, {
	      text: main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_CANCEL'),
	      style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	      onclick: () => this.close()
	    }]
	  });
	  (_this$getButton = this.getButton('submit')) == null ? void 0 : _this$getButton.setDisabled(true);
	}
	function _onPasswordInput2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2, _this$getButton2;
	  const password = (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input]) == null ? void 0 : _babelHelpers$classPr2.getValue()) != null ? _babelHelpers$classPr : '';
	  (_this$getButton2 = this.getButton('submit')) == null ? void 0 : _this$getButton2.setDisabled(password.trim().length === 0);
	}
	function _showSuccess2() {
	  this.setContentAlign(mail_client_dialog_baseDialog.ContentPosition.center);
	  this.setBodyPadding('24px 0 10px 0');
	  this.setTitle('');
	  this.setContent(main_core.Tag.render(_t2 || (_t2 = _`
			<div class="mail__client_dialog_passwordless-connect_success">
				<img
					class="mail__client_dialog_passwordless-connect_success-icon"
					src="/bitrix/js/mail/client/dialog/passwordless-connect/images/success.webp"
					alt=""
				/>
				<div class="mail__client_dialog_passwordless-connect_success-title">
					${0}
				</div>
			</div>
		`), main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_SUCCESS_TITLE')));
	  this.setActions({
	    position: mail_client_dialog_baseDialog.ActionPosition.center,
	    actions: [{
	      text: main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_CLOSE'),
	      style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
	      onclick: () => babelHelpers.classPrivateFieldLooseBase(this, _onSuccessClose)[_onSuccessClose]()
	    }]
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _fireConfetti)[_fireConfetti]();
	}
	function _fireConfetti2() {
	  if (main_core.Browser.isFirefox()) {
	    const canvas = document.createElement('canvas');
	    main_core.Dom.style(canvas, {
	      position: 'fixed',
	      top: '0',
	      left: '0',
	      width: '100%',
	      height: '100%',
	      'pointer-events': 'none',
	      'z-index': '111111'
	    });
	    main_core.Dom.append(canvas, document.body);
	    const confetti = ui_confetti.Confetti.create(canvas, {
	      resize: true,
	      useWorker: true
	    });
	    confetti({
	      particleCount: 250,
	      spread: 100,
	      origin: {
	        y: 0.65
	      }
	    }).then(() => main_core.Dom.remove(canvas)).catch(() => main_core.Dom.remove(canvas));
	    return;
	  }
	  ui_confetti.Confetti.fire({
	    particleCount: 250,
	    spread: 100,
	    origin: {
	      y: 0.65
	    },
	    zIndex: 111111
	  });
	}
	function _onSuccessClose2() {
	  this.close();
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _newMailboxId)[_newMailboxId] || !babelHelpers.classPrivateFieldLooseBase(this, _messageListUrl)[_messageListUrl]) {
	    document.location.reload();
	    return;
	  }
	  const url = babelHelpers.classPrivateFieldLooseBase(this, _messageListUrl)[_messageListUrl].replace('#id#', babelHelpers.classPrivateFieldLooseBase(this, _newMailboxId)[_newMailboxId]).replace('#start_sync_with_showing_stepper#', 'true');
	  window.location.href = BX.util.add_url_param(url, {
	    open_settings: 'Y'
	  });
	}
	function _submit2() {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending]) {
	    return;
	  }
	  const password = (_babelHelpers$classPr3 = (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input]) == null ? void 0 : (_babelHelpers$classPr5 = _babelHelpers$classPr4.getValue()) == null ? void 0 : _babelHelpers$classPr5.trim()) != null ? _babelHelpers$classPr3 : '';
	  if (password.length === 0) {
	    var _babelHelpers$classPr6;
	    (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input]) == null ? void 0 : _babelHelpers$classPr6.setError(main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_ERROR_EMPTY_PASSWORD'));
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = true;
	  const submitButton = this.getButton('submit');
	  submitButton == null ? void 0 : submitButton.setWaiting(true);
	  main_core.ajax.runAction('mail.mailboxconnecting.completePasswordlessRequest', {
	    data: {
	      mailboxId: babelHelpers.classPrivateFieldLooseBase(this, _mailboxId)[_mailboxId],
	      password
	    }
	  }).then(response => {
	    var _response$data$mailbo, _response$data2;
	    babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = false;
	    submitButton == null ? void 0 : submitButton.setWaiting(false);
	    babelHelpers.classPrivateFieldLooseBase(this, _newMailboxId)[_newMailboxId] = (_response$data$mailbo = (_response$data2 = response.data) == null ? void 0 : _response$data2.mailboxId) != null ? _response$data$mailbo : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _showSuccess)[_showSuccess]();
	  }).catch(response => {
	    var _response$errors$0$me, _response$errors, _response$errors$, _babelHelpers$classPr7;
	    babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = false;
	    submitButton == null ? void 0 : submitButton.setWaiting(false);
	    const errorMessage = (_response$errors$0$me = response == null ? void 0 : (_response$errors = response.errors) == null ? void 0 : (_response$errors$ = _response$errors[0]) == null ? void 0 : _response$errors$.message) != null ? _response$errors$0$me : main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_ERROR_GENERIC');
	    (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input]) == null ? void 0 : _babelHelpers$classPr7.setError(errorMessage);
	  });
	}
	function _decline2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = true;
	  const declineButton = this.getButton('decline');
	  declineButton == null ? void 0 : declineButton.setWaiting(true);
	  main_core.ajax.runAction('mail.mailboxconnecting.cancelPasswordlessRequest', {
	    data: {
	      mailboxId: babelHelpers.classPrivateFieldLooseBase(this, _mailboxId)[_mailboxId]
	    }
	  }).then(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = false;
	    declineButton == null ? void 0 : declineButton.setWaiting(false);
	    this.close();
	    BX.UI.Notification.Center.notify({
	      content: main_core.Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_DECLINE_SUCCESS'),
	      position: 'top-right',
	      autoHideDelay: 3000
	    });
	  }).catch(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = false;
	    declineButton == null ? void 0 : declineButton.setWaiting(false);
	  });
	}

	exports.PasswordlessConnect = PasswordlessConnect;

}((this.BX.Mail.Client.Dialog = this.BX.Mail.Client.Dialog || {}),BX,BX.UI,BX.UI.System.Input,BX.UI,BX.Mail.Client.Dialog));
//# sourceMappingURL=passwordless-connect.bundle.js.map
