/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports,main_core,ui_buttons,ui_system_input,mail_client_dialog_baseDialog) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3;
	var _input = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("input");
	var _sending = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sending");
	var _renderForm = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderForm");
	var _showSuccess = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSuccess");
	var _showRepeat = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showRepeat");
	var _cancelRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cancelRequest");
	var _showLimitSlider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showLimitSlider");
	var _submit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("submit");
	class MailboxConnectionRequest extends mail_client_dialog_baseDialog.BaseDialog {
	  constructor() {
	    super({
	      id: 'mail-mailbox-connection-request',
	      title: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_POPUP_TITLE'),
	      width: 430
	    });
	    Object.defineProperty(this, _submit, {
	      value: _submit2
	    });
	    Object.defineProperty(this, _cancelRequest, {
	      value: _cancelRequest2
	    });
	    Object.defineProperty(this, _showRepeat, {
	      value: _showRepeat2
	    });
	    Object.defineProperty(this, _showSuccess, {
	      value: _showSuccess2
	    });
	    Object.defineProperty(this, _renderForm, {
	      value: _renderForm2
	    });
	    Object.defineProperty(this, _input, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _sending, {
	      writable: true,
	      value: false
	    });
	  }
	  show() {
	    super.show();
	    babelHelpers.classPrivateFieldLooseBase(this, _renderForm)[_renderForm]();
	  }
	}
	function _renderForm2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _input)[_input] = new ui_system_input.Input({
	    placeholder: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_COMMENT_PLACEHOLDER'),
	    stretched: true,
	    dataTestId: 'mail-mailbox-connection-request-comment'
	  });
	  this.setContent(main_core.Tag.render(_t || (_t = _`
			<div class="mail__client_dialog_mailbox-connection-request_form">
				<div class="mail__client_dialog_base-dialog_content-description">
					${0}
				</div>
				${0}
			</div>
		`), main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_DESCRIPTION'), babelHelpers.classPrivateFieldLooseBase(this, _input)[_input].render()));
	  this.setActions({
	    position: mail_client_dialog_baseDialog.ActionPosition.left,
	    actions: [{
	      id: 'submit',
	      text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUBMIT'),
	      style: ui_buttons.AirButtonStyle.FILLED,
	      onclick: () => babelHelpers.classPrivateFieldLooseBase(this, _submit)[_submit]()
	    }, {
	      text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CANCEL'),
	      style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	      onclick: () => this.close()
	    }]
	  });
	}
	function _showSuccess2() {
	  this.setContentAlign(mail_client_dialog_baseDialog.ContentPosition.center);
	  this.setBodyPadding('24px 0 10px 0');
	  this.setTitle('');
	  this.setWidth(430);
	  this.hideCloseIcon();
	  this.setContent(main_core.Tag.render(_t2 || (_t2 = _`
			<div class="mail__client_dialog_mailbox-connection-request_success">
				<video
					class="mail__client_dialog_mailbox-connection-request_success-video"
					src="/bitrix/js/mail/client/dialog/mailbox-connection-request/images/success.mp4"
					autoplay
					muted
					playsinline
				></video>
				<div class="mail__client_dialog_mailbox-connection-request_success-title">
					${0}
				</div>
			</div>
		`), main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUCCESS_TITLE')));
	  this.setActions({
	    position: mail_client_dialog_baseDialog.ActionPosition.center,
	    actions: [{
	      text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CLOSE'),
	      style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
	      onclick: () => this.close()
	    }]
	  });
	}
	function _showRepeat2() {
	  this.setContentAlign(mail_client_dialog_baseDialog.ContentPosition.center);
	  this.setBodyPadding('52px 0 18px 0');
	  this.setTitle('');
	  this.setWidth(430);
	  this.setContent(main_core.Tag.render(_t3 || (_t3 = _`
			<div class="mail__client_dialog_mailbox-connection-request_repeat">
				<video
					class="mail__client_dialog_mailbox-connection-request_repeat-video"
					src="/bitrix/js/mail/client/dialog/mailbox-connection-request/images/success.mp4"
					autoplay
					muted
					playsinline
				></video>
				<div class="mail__client_dialog_mailbox-connection-request_repeat-text">
					<div class="mail__client_dialog_mailbox-connection-request_repeat-title">
						${0}
					</div>
					<div class="mail__client_dialog_mailbox-connection-request_repeat-description">
						${0}
					</div>
				</div>
			</div>
		`), main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUCCESS_TITLE'), main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_ALREADY_SENT')));
	  this.setActions({
	    position: mail_client_dialog_baseDialog.ActionPosition.center,
	    actions: [{
	      id: 'cancel-request',
	      text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CANCEL_REQUEST'),
	      style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	      onclick: () => babelHelpers.classPrivateFieldLooseBase(this, _cancelRequest)[_cancelRequest]()
	    }]
	  });
	}
	function _cancelRequest2() {
	  const cancelButton = this.getButton('cancel-request');
	  cancelButton == null ? void 0 : cancelButton.setWaiting(true);
	  main_core.ajax.runAction('mail.api.mailboxconnectionrequest.cancelOwnRequest').then(() => {
	    cancelButton == null ? void 0 : cancelButton.setWaiting(false);
	    this.close();
	  }).catch(() => {
	    cancelButton == null ? void 0 : cancelButton.setWaiting(false);
	  });
	}
	function _showLimitSlider2() {
	  var _BX$UI, _BX$UI$FeaturePromote;
	  const promoter = (_BX$UI = BX.UI) == null ? void 0 : (_BX$UI$FeaturePromote = _BX$UI.FeaturePromotersRegistry) == null ? void 0 : _BX$UI$FeaturePromote.getPromoter({
	    code: 'limit_contact_center_mail_box_number'
	  });
	  promoter == null ? void 0 : promoter.show();
	}
	function _submit2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = true;
	  const submitButton = this.getButton('submit');
	  submitButton == null ? void 0 : submitButton.setWaiting(true);
	  const comment = (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input]) == null ? void 0 : (_babelHelpers$classPr3 = _babelHelpers$classPr2.getValue()) == null ? void 0 : _babelHelpers$classPr3.trim()) != null ? _babelHelpers$classPr : '';
	  main_core.ajax.runAction('mail.api.mailboxconnectionrequest.createRequest', {
	    data: {
	      comment
	    }
	  }).then(response => {
	    babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = false;
	    submitButton == null ? void 0 : submitButton.setWaiting(false);
	    if (response.data.isRepeat) {
	      babelHelpers.classPrivateFieldLooseBase(this, _showRepeat)[_showRepeat]();
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _showSuccess)[_showSuccess]();
	    }
	  }).catch(response => {
	    var _response$errors$0$co, _response$errors, _response$errors$, _response$errors$0$me, _response$errors2, _response$errors2$, _babelHelpers$classPr4;
	    babelHelpers.classPrivateFieldLooseBase(this, _sending)[_sending] = false;
	    submitButton == null ? void 0 : submitButton.setWaiting(false);
	    const errorCode = (_response$errors$0$co = response == null ? void 0 : (_response$errors = response.errors) == null ? void 0 : (_response$errors$ = _response$errors[0]) == null ? void 0 : _response$errors$.code) != null ? _response$errors$0$co : '';
	    if (errorCode === 'MAIL_CONNECTION_REQUEST_LIMIT_EXCEEDED') {
	      this.close();
	      babelHelpers.classPrivateFieldLooseBase(MailboxConnectionRequest, _showLimitSlider)[_showLimitSlider]();
	      return;
	    }
	    const errorMessage = (_response$errors$0$me = response == null ? void 0 : (_response$errors2 = response.errors) == null ? void 0 : (_response$errors2$ = _response$errors2[0]) == null ? void 0 : _response$errors2$.message) != null ? _response$errors$0$me : main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_ERROR');
	    (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _input)[_input]) == null ? void 0 : _babelHelpers$classPr4.setError(errorMessage);
	  });
	}
	Object.defineProperty(MailboxConnectionRequest, _showLimitSlider, {
	  value: _showLimitSlider2
	});

	exports.MailboxConnectionRequest = MailboxConnectionRequest;

}((this.BX.Mail.Client.Dialog = this.BX.Mail.Client.Dialog || {}),BX,BX.UI,BX.UI.System.Input,BX.Mail.Client.Dialog));
//# sourceMappingURL=mailbox-connection-request.bundle.js.map
