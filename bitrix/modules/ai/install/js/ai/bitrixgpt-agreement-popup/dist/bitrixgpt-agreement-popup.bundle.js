/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,ui_system_dialog,ui_system_typography,ui_buttons,ui_notification) {
	'use strict';

	let _ = t => t,
	  _t;
	let isAgreementPopupShown = false;
	function showBitrixGptAgreementPopup(options) {
	  if (isAgreementPopupShown) {
	    return;
	  }
	  if (!main_core.Type.isPlainObject(options) || !main_core.Type.isNumber(options.attempt)) {
	    return;
	  }
	  isAgreementPopupShown = true;
	  const messages = {
	    title: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_TITLE'),
	    text1: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_TEXT_1'),
	    text2: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_TEXT_2', {
	      '#LINK#': `<a href="${getAgreementLink()}" target="_blank" rel="noopener noreferrer">`,
	      '#/LINK#': '</a>'
	    }),
	    accept: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_ACCEPT'),
	    decline: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_DECLINE'),
	    skip: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_SKIP'),
	    skipError: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_SKIP_ERROR'),
	    acceptError: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_ACCEPT_ERROR'),
	    declineError: main_core.Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_DECLINE_ERROR')
	  };
	  const {
	    attempt,
	    showLimit
	  } = options;
	  const showSkip = options.showSkip === true || options.showSkip !== false && main_core.Type.isNumber(showLimit) && attempt < showLimit;
	  let dialog = null;
	  const notifyError = (defaultMessage, response) => {
	    var _response$errors, _response$errors$, _UI$Notification;
	    let message = defaultMessage;
	    if (response != null && (_response$errors = response.errors) != null && (_response$errors$ = _response$errors[0]) != null && _response$errors$.message) {
	      message = response.errors[0].message;
	    }
	    if (ui_notification.UI != null && (_UI$Notification = ui_notification.UI.Notification) != null && _UI$Notification.Center) {
	      ui_notification.UI.Notification.Center.notify({
	        content: message
	      });
	    } else {
	      alert(message);
	    }
	  };
	  const requestAction = (action, errorMessage, button, callback) => {
	    if (button) {
	      button.setWaiting(true);
	    }
	    main_core.ajax.runAction(action).then(() => {
	      var _dialog;
	      (_dialog = dialog) == null ? void 0 : _dialog.hide();
	      if (main_core.Type.isFunction(callback)) {
	        callback();
	      }
	    }).catch(response => {
	      notifyError(errorMessage, response);
	    }).finally(() => {
	      if (button) {
	        button.setWaiting(false);
	      }
	    });
	  };
	  const buttons = [];
	  buttons.push(new ui_buttons.Button({
	    text: messages.accept,
	    useAirDesign: true,
	    style: ui_buttons.Button.AirStyle.OUTLINE,
	    onclick: button => {
	      requestAction('ai.bitrixgptagreement.accept', messages.acceptError, button, () => {
	        main_core.Page.reload();
	      });
	    }
	  }));
	  buttons.push(new ui_buttons.Button({
	    text: messages.decline,
	    useAirDesign: true,
	    style: ui_buttons.Button.AirStyle.OUTLINE,
	    onclick: button => {
	      requestAction('ai.bitrixgptagreement.decline', messages.declineError, button, () => {
	        main_core.Page.reload();
	      });
	    }
	  }));
	  if (showSkip && main_core.Type.isStringFilled(messages.skip)) {
	    buttons.push(new ui_buttons.Button({
	      text: messages.skip,
	      useAirDesign: true,
	      style: ui_buttons.Button.AirStyle.OUTLINE,
	      onclick: button => {
	        requestAction('ai.bitrixgptagreement.skip', messages.skipError, button);
	      }
	    }));
	  }
	  const text1 = ui_system_typography.Text.render(messages.text1, {
	    tag: 'p',
	    align: 'center',
	    size: 'md',
	    className: 'ai__bitrixgpt-agreement-popup-text'
	  });
	  const text2 = ui_system_typography.Text.render(messages.text2, {
	    tag: 'p',
	    align: 'center',
	    size: 'md',
	    className: 'ai__bitrixgpt-agreement-popup-text'
	  });
	  text2.innerHTML = messages.text2;
	  const content = main_core.Tag.render(_t || (_t = _`
		<div class="ai__bitrixgpt-agreement-popup-content">
			<div class="ai__bitrixgpt-agreement-popup-img"></div>
			${0}
			${0}
		</div>
	`), text1, text2);
	  dialog = new ui_system_dialog.Dialog({
	    title: messages.title,
	    content,
	    rightButtons: buttons,
	    hasOverlay: true,
	    closeByClickOutside: false,
	    hasCloseButton: false,
	    closeByEsc: false,
	    width: 492
	  });
	  dialog.show();
	}
	const getAgreementLink = () => {
	  const zone = main_core.Extension.getSettings('ai.bitrixgpt-agreement-popup').zone;
	  const linksByZone = {
	    ru: 'https://www.bitrix24.ru/about/agreement.php',
	    kz: 'https://www.bitrix24.kz/about/agreement.php',
	    by: 'https://www.bitrix24.by/about/agreement.php',
	    en: 'https://www.bitrix24.com/about/agreement.php'
	  };
	  return linksByZone[zone] || linksByZone.en;
	};

	exports.showBitrixGptAgreementPopup = showBitrixGptAgreementPopup;

}((this.BX.AI = this.BX.AI || {}),BX,BX.UI.System,BX.UI.System.Typography,BX.UI,BX));
//# sourceMappingURL=bitrixgpt-agreement-popup.bundle.js.map
