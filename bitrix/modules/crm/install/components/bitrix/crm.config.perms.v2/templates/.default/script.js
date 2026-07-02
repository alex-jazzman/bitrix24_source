/* eslint-disable */
(function (main_core, ui_accessrights_v2, ui_buttons, ui_dialogs_messagebox) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm');
	class ConfigPermsComponent {
		constructor(config) {
			this.AccessRightsOption = config.AccessRightsOption;
			this.AccessRights = config.AccessRights;
			this.hasLeftMenu = config.hasLeftMenu;
			this.menuId = config.menuId;
			this.useAirDesign = config.useAirDesign ?? false;
		}
		init() {
			this.AccessRights.draw();
			this.#renderHelpButton();
			if (this.hasLeftMenu) {
				this.#addWrapperSliderContent();
				this.#addWrapperLeftMenu();
			}
		}
		#addWrapperSliderContent() {
			const sliderContent = document.getElementById('ui-page-slider-content');
			if (sliderContent) {
				const wrapperSliderContent = document.createElement('div');
				wrapperSliderContent.className = 'crm-config-perms-v2-slider-content';
				sliderContent.parentNode.insertBefore(wrapperSliderContent, sliderContent);
				wrapperSliderContent.appendChild(sliderContent);
			}
		}
		#addWrapperLeftMenu() {
			const leftPanel = document.getElementById('left-panel');
			if (leftPanel) {
				const wrapperLeftMenu = document.createElement('div');
				wrapperLeftMenu.className = 'crm-config-perms-v2-sidebar';
				leftPanel.parentNode.insertBefore(wrapperLeftMenu, leftPanel);
				wrapperLeftMenu.appendChild(leftPanel);
			}
		}
		#renderHelpButton() {
			const Helper = main_core.Reflection.getClass('top.BX.Helper');
			const helpButton = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.SMALL,
				text: main_core.Loc.getMessage('CRM_CONFIG_PERMS_HELP_MSGVER_1'),
				style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
				useAirDesign: true,
				onclick: () => {
					const articleCode = '23240636';
					Helper?.show(`redirect=detail&code=${articleCode}`);
				}
			});
			const parentElement = document.querySelector('.crm-config-perms-v2-header');
			helpButton.renderTo(parentElement);
		}
		openPermission(controllerData) {
			if (this.menuId === controllerData.menuId) {
				return;
			}
			if (!this.AccessRights.hasUnsavedChanges()) {
				this.redrawAccessRight(controllerData);
			} else {
				event.stopImmediatePropagation();
				this.#confirmBeforeRedraw(controllerData);
			}
		}
		redrawAccessRight(controllerData) {
			const loader = new BX.Loader({
				target: document.getElementById('bx-crm-perms-config-permissions')
			});
			const selectedMember = this.AccessRights.getSelectedMember();
			this.AccessRights.destroy();
			loader.show();
			this.#runGetDataAjaxRequest(controllerData).then(options => {
				this.AccessRightsOption = {
					...options,
					selectedMember
				};
				this.AccessRights = new ui_accessrights_v2.App(this.AccessRightsOption);
				this.AccessRights.draw();
				scrollTo({
					top: 0
				});
				this.menuId = controllerData.menuId;
			}).catch(response => {
				console.warn('ui.accessrights.v2: error during redraw', response);
				this.#showNotification(response?.errors?.[0]?.message || 'Something went wrong');
			}).finally(() => {
				loader.hide();
			});
		}
		#runGetDataAjaxRequest(controllerData) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:crm.config.perms.v2', 'getData', {
					mode: 'class',
					json: {
						controllerData
					}
				}).then(response => {
					resolve(response.data);
				}).catch(reject);
			});
		}
		#confirmBeforeRedraw(controllerData) {
			const box = ui_dialogs_messagebox.MessageBox.create({
				message: main_core.Loc.getMessage('CRM_CONFIG_PERMS_SAVE_POPUP_TITLE'),
				modal: true,
				useAirDesign: true,
				buttons: [new ui_buttons.SaveButton({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: button => {
						button.setWaiting(true);
						this.AccessRights.sendActionRequest().then(() => {
							document.querySelector(`[data-menu-id="${controllerData.menuId}"]`).click();
						}).catch(() => {}).finally(() => {
							box.close();
						});
					}
				}), new ui_buttons.CancelButton({
					text: main_core.Loc.getMessage('CRM_CONFIG_PERMS_SAVE_POPUP_CANCEL'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					onclick: () => {
						box.close();
					}
				})],
				popupOptions: {
					fixed: true
				}
			});
			box.show();
		}
		#showNotification(title) {
			BX.UI.Notification.Center.notify({
				content: title,
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
	}
	namespace.ConfigPermsComponent = ConfigPermsComponent;

})(BX, BX.UI.AccessRights.V2, BX.UI, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
