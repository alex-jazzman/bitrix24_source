this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports,main_core) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4;
	const defaultHelpdeskTag = 'helpdesklink';
	const defaultRedirectValue = 'detail';
	class Helpdesk {
	  static show(code, redirect = defaultRedirectValue) {
	    if (top.BX.Helper) {
	      const redirectLink = main_core.Tag.safe(_t || (_t = _`${0}`), redirect);
	      const helpdeskCode = main_core.Tag.safe(_t2 || (_t2 = _`${0}`), code);
	      top.BX.Helper.show(`redirect=${redirectLink}&code=${helpdeskCode}`);
	    }
	  }
	  static bindHandler(element, code, redirect = defaultRedirectValue) {
	    main_core.Event.bind(element, 'click', event => {
	      this.show(code, redirect);
	      event.preventDefault();
	    });
	  }
	  static replaceLink(text, code, redirect = defaultRedirectValue) {
	    return text.replace(`[${defaultHelpdeskTag}]`, `
					<a class="sign-v2e-helper__link" 
						href="javascript:top.BX.Helper.show('redirect=${main_core.Tag.safe(_t3 || (_t3 = _`${0}`), redirect)}&code=${main_core.Tag.safe(_t4 || (_t4 = _`${0}`), code)}');"
					>
				`).replace(`[/${defaultHelpdeskTag}]`, '</a>');
	  }
	}

	class Link {
	  static replaceInLoc(text, link, linkTag = 'link') {
	    return text.replace(`[${linkTag}]`, `
					<a class="sign-v2e-helper__link" 
						href="${link}"
						target="_blank"
					>
				`).replace(`[/${linkTag}]`, '</a>');
	  }
	}

	class Hint {
	  static create(dom, popupParameters = {}) {
	    const popupHint = main_core.Reflection.getClass('BX.UI.Hint').createInstance({
	      popupParameters: {
	        autoHide: true,
	        ...popupParameters
	      }
	    });
	    popupHint.init(dom);
	    main_core.Dom.addClass(dom, '--with-sign-hint');
	    return popupHint;
	  }
	}

	exports.Helpdesk = Helpdesk;
	exports.Link = Link;
	exports.Hint = Hint;

}((this.BX.Sign.V2 = this.BX.Sign.V2 || {}),BX));
//# sourceMappingURL=helper.bundle.js.map
