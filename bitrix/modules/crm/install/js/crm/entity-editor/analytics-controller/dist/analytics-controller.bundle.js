/* eslint-disable */
this.BX = this.BX || {};
(function (exports) {
	'use strict';

	class EntityEditorAnalyticsController extends BX.UI.EntityEditorController {
		ajaxForms = [];
		formBeforeSubmitHandler;
		postFormAnalytics = {};
		appendParamsFromCurrentUrl = true;
		constructor() {
			super();
			this.formBeforeSubmitHandler = this.onAjaxFormBeforeSubmit.bind(this);
		}
		doInitialize() {
			super.doInitialize();
			const config = this.getConfig ? this.getConfig() : null;
			this.postFormAnalytics = BX.Type.isPlainObject(config?.postFormAnalytics) ? config.postFormAnalytics : {};
			this.appendParamsFromCurrentUrl = BX.Type.isBoolean(config?.appendParamsFromCurrentUrl) ? config.appendParamsFromCurrentUrl : true;
		}
		bindToAjaxForms(ajaxForms) {
			this.unbindFromAjaxForms();
			let forms = [];
			if (ajaxForms && typeof ajaxForms === 'object' && !BX.Type.isFunction(ajaxForms.submit)) {
				Object.keys(ajaxForms).forEach(key => {
					if (ajaxForms[key]) {
						forms.push(ajaxForms[key]);
					}
				});
			} else if (ajaxForms) {
				forms = [ajaxForms];
			}
			this.ajaxForms = forms;
			this.ajaxForms.forEach(form => {
				BX.addCustomEvent(form, 'onBeforeSubmit', this.formBeforeSubmitHandler);
			});
		}
		unbindFromAjaxForms() {
			this.ajaxForms.forEach(form => {
				BX.removeCustomEvent(form, 'onBeforeSubmit', this.formBeforeSubmitHandler);
			});
			this.ajaxForms = [];
		}
		onAjaxFormBeforeSubmit(ajaxForm, eventArgs) {
			let analytics = {};
			let existing = {};
			const isComponentAjax = ajaxForm instanceof BX.UI.ComponentAjax;
			const isAjaxForm = ajaxForm instanceof BX.UI.AjaxForm;
			if (isComponentAjax && eventArgs && BX.Type.isPlainObject(eventArgs.options) && BX.Type.isPlainObject(eventArgs.options.data) && BX.Type.isPlainObject(eventArgs.options.data.ANALYTICS)) {
				existing = eventArgs.options.data.ANALYTICS;
			} else if (isAjaxForm && ajaxForm._config && BX.Type.isPlainObject(ajaxForm._config.data) && BX.Type.isPlainObject(ajaxForm._config.data.ANALYTICS)) {
				existing = ajaxForm._config.data.ANALYTICS;
			}
			if (BX.Type.isPlainObject(existing)) {
				analytics = BX.Runtime.merge(analytics, existing);
			}
			if (this.appendParamsFromCurrentUrl) {
				try {
					const queryAnalytics = new BX.Uri(decodeURI(window.location.href)).getQueryParam('st');
					if (BX.Type.isPlainObject(queryAnalytics)) {
						analytics = BX.Runtime.merge(analytics, queryAnalytics);
					}
				} catch (e) {}
			}
			if (BX.Type.isPlainObject(this.postFormAnalytics)) {
				analytics = BX.Runtime.merge(analytics, this.postFormAnalytics);
			}
			if (Object.keys(analytics).length === 0) {
				return;
			}
			if (isComponentAjax) {
				if (!BX.Type.isObject(eventArgs)) {
					return;
				}
				if (!BX.Type.isPlainObject(eventArgs.options)) {
					eventArgs.options = {};
				}
				if (!BX.Type.isPlainObject(eventArgs.options.data)) {
					eventArgs.options.data = {};
				}
				eventArgs.options.data.ANALYTICS = analytics;
			} else if (isAjaxForm) {
				if (!ajaxForm._config) {
					ajaxForm._config = {};
				}
				if (!BX.Type.isPlainObject(ajaxForm._config.data)) {
					ajaxForm._config.data = {};
				}
				ajaxForm._config.data.ANALYTICS = analytics;
			}
		}
		release() {
			this.unbindFromAjaxForms();
		}
		static create(id, settings) {
			const self = new EntityEditorAnalyticsController();
			self.initialize(id, settings);
			return self;
		}
	}

	exports.EntityEditorAnalyticsController = EntityEditorAnalyticsController;

})(this.BX.Crm = this.BX.Crm || {});
//# sourceMappingURL=analytics-controller.bundle.js.map
