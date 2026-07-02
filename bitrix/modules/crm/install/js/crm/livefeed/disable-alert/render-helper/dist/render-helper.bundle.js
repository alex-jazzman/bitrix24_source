/* eslint-disable */
(function (main_core) {
	'use strict';

	class DisplayAlertsSupport {
		DisableAlert = null;
		isShowAlert = null;
		daysUntilDisable = null;
		showAlertUserOption = null;
		alertContainerSelector = null;
		alertContainersStack = [];
		canShowAlerts() {
			return this.isShowAlert === true && this.DisableAlert && main_core.Type.isString(this.alertContainerSelector) && main_core.Type.isString(this.showAlertUserOption) && main_core.Type.isInteger(this.daysUntilDisable) && this.daysUntilDisable > 0;
		}
		renderAlerts() {
			if (!this.canShowAlerts()) {
				return;
			}
			this.alertContainersStack.forEach(alertContainer => {
				this.renderAlert(alertContainer);
			});
			this.alertContainersStack = [];
		}
		renderAlert(container) {
			if (container.innerHTML !== '') {
				return;
			}
			const closeBtnCallback = () => {
				this.isShowAlert = false;
				BX.userOptions.save('crm', this.showAlertUserOption, 'show', 'N');
				const alertContainers = document.querySelectorAll(`.${this.alertContainerSelector}`);
				alertContainers.forEach(alertContainer => {
					alertContainer.remove();
				});
			};
			main_core.Dom.style(container, {
				background: 'white',
				padding: '10px',
				'margin-bottom': '-10px',
				'border-radius': '10px 10px 0 0'
			});
			new this.DisableAlert({
				alertContainer: container,
				daysUntilDisable: this.daysUntilDisable,
				closeBtnCallback
			}).render();
		}
	}
	const isCrm = window.location.pathname.includes('/crm/');
	if (!isCrm) {
		const alertSupport = new DisplayAlertsSupport({});
		main_core.Event.EventEmitter.subscribe('crm:disableLFAlertContainerRendered', event => {
			const alertContainer = event.data.container;
			if (alertSupport.canShowAlerts()) {
				alertSupport.renderAlert(alertContainer);
			} else {
				alertSupport.alertContainersStack.push(alertContainer);
			}
		});
		main_core.Runtime.loadExtension('crm.livefeed.disable-alert').then(exports$1 => {
			if (!exports$1.DisableAlert) {
				alertSupport.isShowAlert = false;
				return;
			}
			alertSupport.DisableAlert = exports$1.DisableAlert;
			main_core.ajax.runAction('crm.controller.integration.socialnetwork.livefeed.getDisablingInfo').then(response => {
				alertSupport.isShowAlert = response.data.isShowAlert;
				alertSupport.daysUntilDisable = response.data.daysUntilDisable;
				alertSupport.alertContainerSelector = response.data.alertContainerSelector;
				alertSupport.showAlertUserOption = response.data.showAlertUserOption;
				alertSupport.renderAlerts();
			}).catch(error => {
				alertSupport.isShowAlert = false;
			});
		}).catch(error => {
			alertSupport.isShowAlert = false;
		});
	}

})(BX);
//# sourceMappingURL=render-helper.bundle.js.map
