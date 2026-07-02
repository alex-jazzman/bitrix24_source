/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_alerts) {
	'use strict';

	class DisableAlert {
		constructor(options = {}) {
			if (!main_core.Type.isElementNode(options.alertContainer)) {
				throw new Error('Livefeed.DisableAlert: \'alertContainer\' must be a DOM element.');
			}
			if (!main_core.Type.isInteger(options.daysUntilDisable)) {
				throw new TypeError('Livefeed.DisableAlert: \'daysUntilDisable\' must be integer');
			}
			this.alertContainer = options.alertContainer;
			this.daysUntilDisable = options.daysUntilDisable;
			this.closeBtnCallback = main_core.Type.isFunction(options.closeBtnCallback) ? options.closeBtnCallback : () => {};
			this.alert = new ui_alerts.Alert({
				text: this.getText(),
				color: ui_alerts.Alert.Color.WARNING,
				icon: ui_alerts.Alert.Icon.INFO,
				closeBtn: true,
				animate: true
			});
			main_core.Event.bind(this.alert.getCloseBtn(), 'click', this.closeBtnCallback);
		}
		render() {
			this.alert.renderTo(this.alertContainer);
		}
		getText() {
			const helpdeskCode = '18371940';
			return main_core.Loc.getMessagePlural('CRM_LIVE_FEED_DISABLE_ALERT_TEXT', this.daysUntilDisable, {
				'#DAYS_UNTIL_DISABLE#': this.daysUntilDisable,
				'[helpdesklink]': `<a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${helpdeskCode}');">`,
				'[/helpdesklink]': '</a>'
			});
		}
	}

	exports.DisableAlert = DisableAlert;

})(this.BX.Crm.Livefeed = this.BX.Crm.Livefeed || {}, BX, BX.UI);
//# sourceMappingURL=disable-alert.bundle.js.map
