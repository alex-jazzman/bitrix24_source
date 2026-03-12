/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports,main_core,ui_feedback_form) {
	'use strict';

	class PartnerFormType {}
	PartnerFormType.ORDER = 'order';
	PartnerFormType.FEEDBACK = 'feedback';
	PartnerFormType.REFUSAL_CHECKOUT = 'refusal_checkout';
	PartnerFormType.REFUSAL = 'refusal';

	class PartnerForm {
	  static show(params) {
	    const formParams = this.initParams(params, PartnerFormType.ORDER);
	    ui_feedback_form.Form.open(formParams);
	  }
	  static showFeedback(params) {
	    const formParams = this.initParams(params, PartnerFormType.FEEDBACK);
	    ui_feedback_form.Form.open(formParams);
	  }
	  static showRefusal(params) {
	    const formParams = this.initParams(params, PartnerFormType.REFUSAL);
	    ui_feedback_form.Form.open(formParams);
	  }
	  static showRefusalFromCheckout(params) {
	    const formParams = this.initParams(params, PartnerFormType.REFUSAL_CHECKOUT);
	    ui_feedback_form.Form.open(formParams);
	  }
	  static renderInline(params) {
	    const requestParams = this.initParams(params);
	    const {
	      node,
	      ...requestData
	    } = requestParams;
	    return main_core.ajax.runAction('ui.feedback.loadData', {
	      json: requestData
	    }).then(response => {
	      const data = response.data && response.data.params ? response.data.params : {};
	      const formParams = {
	        ...requestParams,
	        id: data.id,
	        form: data.form,
	        portal: data.portal,
	        presets: data.presets
	      };
	      if (!main_core.Type.isStringFilled(formParams.title)) {
	        formParams.title = data.title;
	      }
	      return new ui_feedback_form.Form(formParams);
	    });
	  }
	  static initParams(params, type = PartnerFormType.ORDER) {
	    const formParams = {
	      id: params.id,
	      forms: this.getFormsByType(type),
	      portalUri: main_core.Extension.getSettings('ui.feedback.partnerform').get('partnerUri'),
	      presets: {
	        ...main_core.Extension.getSettings('ui.feedback.partnerform').get('partnerFeedbackPresets'),
	        ...(main_core.Type.isNil(params.presets) ? {
	          source: params.source
	        } : params.presets)
	      },
	      showTitle: params.showTitle === true
	    };
	    if (main_core.Type.isStringFilled(params.title)) {
	      formParams.title = params.title;
	      formParams.showTitle = true;
	    }
	    if (main_core.Type.isStringFilled(params.button)) {
	      formParams.button = params.button;
	    }
	    if (!main_core.Type.isNil(params.node)) {
	      formParams.node = params.node;
	    }
	    return formParams;
	  }
	  static getFormsByType(type) {
	    switch (type) {
	      case PartnerFormType.FEEDBACK:
	        return main_core.Extension.getSettings('ui.feedback.partnerform').get('partnerFeedbackForms');
	      case PartnerFormType.REFUSAL:
	        return main_core.Extension.getSettings('ui.feedback.partnerform').get('partnerRefusalForms');
	      case PartnerFormType.REFUSAL_CHECKOUT:
	        return main_core.Extension.getSettings('ui.feedback.partnerform').get('partnerRefusalCheckoutForms');
	      case PartnerFormType.ORDER:
	      default:
	        return main_core.Extension.getSettings('ui.feedback.partnerform').get('partnerForms');
	    }
	  }
	}

	exports.PartnerForm = PartnerForm;

}((this.BX.UI.Feedback = this.BX.UI.Feedback || {}),BX,BX.UI.Feedback));
//# sourceMappingURL=partner-form.bundle.js.map
