/* eslint-disable */
(function (main_core, main_popup, ui_dialogs_messagebox, ui_switcher, bitrix24_phoneverify) {
	'use strict';

	const PHONE_VERIFY_FORM_ENTITY = 'crm_webform';
	class WebFormList {
		#groupAction = null;
		constructor() {}
		init(params) {
			this.reloadGridTimeoutId = 0;
			this.gridId = params.gridId;
			this.gridNode = document.getElementById(this.gridId);
			this.#renderGridRows();
			BX.addCustomEvent('Grid::updated', () => {
				this.#renderGridRows();
			});
			return this;
		}
		#renderGridRows() {
			this.#renderEntities();
			this.#renderQrButtons();
			this.#renderActiveSwitchers();
		}
		#renderQrButtons() {
			const container = this.#getGridContainer();
			if (!container) {
				return;
			}
			const switcherAttr = 'data-crm-form-qr';
			let switchers = container.querySelectorAll('[' + switcherAttr + ']');
			switchers = Array.prototype.slice.call(switchers);
			switchers.forEach(node => {
				if (node.querySelector('.crm-webform-qr-btn')) {
					return;
				}
				const data = JSON.parse(node.getAttribute(switcherAttr));
				if (data.needVerify) {
					const onClickVerify = () => {
						this.#verifyPhone(PHONE_VERIFY_FORM_ENTITY, data.id, () => {
							new BX.Crm.Form.Qr({
								link: data.path
							}).show();
						});
					};
					node.appendChild(main_core.Tag.render`
					<button
						type="button"
						class="crm-webform-qr-btn ui-btn ui-btn-xs ui-btn-light-border ui-btn-round ui-btn-no-caps ui-btn-icon-share"
						onclick="${onClickVerify}"
					>
						${main_core.Loc.getMessage('CRM_WEBFORM_QR_OPEN')}
					</button>
				`);
				} else {
					new BX.Crm.Form.Qr({
						link: data.path
					}).renderTo(node);
				}
			});
		}
		#renderEntities() {
			const container = this.#getGridContainer();
			if (!container) {
				return;
			}
			const attr = 'data-crm-form-entities';
			let buttons = container.querySelectorAll('[' + attr + ']');
			buttons = Array.prototype.slice.call(buttons);
			buttons.forEach(node => {
				const data = JSON.parse(node.getAttribute(attr));
				const handler = event => {
					event.stopPropagation();
					event.preventDefault();
					const id = 'crm-form-grid-entities-' + data.id;
					let popup = main_popup.PopupManager.getPopupById(id);
					if (popup) {
						const hide = popup.getId() === id;
						popup.destroy();
						popup = null;
						if (hide) {
							return;
						}
					}
					const contentNode = main_core.Tag.render`<div class="crm-webform-list-entities"></div>`;
					data.counters.forEach(counter => {
						const counterHandler = event => {
							event.stopPropagation();
							event.preventDefault();
							BX.SidePanel.Instance.open(counter.LINK);
							return false;
						};
						const caption = main_core.Text.encode(counter.ENTITY_CAPTION);
						const value = main_core.Text.encode(counter.VALUE);
						const counterNode = !counter.LINK ? main_core.Tag.render`
							<span 
								class="crm-webform-active-popup-item-date" 
								title="${caption}"
							>${caption}</span>
						` : main_core.Tag.render`
							<a
								href="${main_core.Text.encode(counter.LINK)}"
								onclick="${counterHandler}"
								class="crm-webform-active-popup-item-date"
								title="${caption}"
							>${caption}</a>
						`;
						contentNode.appendChild(main_core.Tag.render`
						<div class="crm-webform-list-active-popup-row">
							${counterNode}
							<span class="crm-webform-list-entity-counter">${value}</span>
						</div>						
					`);
					});
					let popupWidth = 160;
					popup = main_popup.PopupManager.create({
						id,
						className: 'crm-webform-list-entities-popup',
						closeByEsc: true,
						autoHide: true,
						bindElement: event.target,
						content: contentNode,
						angle: {
							offset: popupWidth / 2 - 16
						},
						offsetLeft: -80 + event.target.offsetWidth / 2 + 40,
						animation: 'fading-slide',
						width: popupWidth,
						padding: 0
					});
					popup.show();
				};
				node.addEventListener('click', handler);
			});
		}
		#renderActiveSwitchers() {
			const container = this.#getGridContainer();
			if (!container) {
				return;
			}
			const switcherAttr = 'data-crm-form-switcher';
			let switchers = container.querySelectorAll('[' + switcherAttr + ']');
			switchers = Array.prototype.slice.call(switchers);
			switchers.forEach(node => {
				node.innerHTML = '';
				const data = JSON.parse(node.getAttribute(switcherAttr));
				const nodeText = main_core.Tag.render`
				<div
					class="${data.active ? '' : 'crm-webform-list-text-gray'}"
				>${main_core.Text.encode(data.dateActiveShort)}</div>
			`;
				const switcher = new BX.UI.Switcher({
					id: 'crm-form-list-item-' + data.id,
					checked: data.active,
					color: 'green',
					handlers: {
						toggled: () => {
							this.activate(data.id, switcher.isChecked(), false, nodeText);
							switcher.isChecked() ? main_core.Dom.removeClass(nodeText, 'crm-webform-list-text-gray') : main_core.Dom.addClass(nodeText, 'crm-webform-list-text-gray');
						}
					}
				});
				switcher.renderTo(node);
				const handler = event => {
					const id = 'crm-form-grid-active-' + data.id;
					let popup = main_popup.PopupManager.getPopupById(id);
					if (popup) {
						const hide = popup.getId() === id;
						popup.destroy();
						popup = null;
						if (hide) {
							return;
						}
					}
					let popupWidth = 250;
					popup = main_popup.PopupManager.create({
						id,
						className: 'crm-webform-list-active-popup',
						closeByEsc: true,
						autoHide: true,
						angle: {
							offset: popupWidth / 2 - 16
						},
						offsetLeft: -125 + event.target.offsetWidth / 2 + 40,
						animation: 'fading-slide',
						bindElement: event.target,
						width: popupWidth,
						padding: 0,
						content: main_core.Tag.render`
						<div class="crm-webform-list-active-popup-row">
							<div class="crm-webform-list-active-popup-item">
								<div class="crm-webform-active-popup-item-caption">${main_core.Text.encode(data.activatedBy.text)}</div>
								<div class="crm-webform-active-popup-item-date"
									title="${main_core.Text.encode(data.dateActiveFull)}"
								>${main_core.Text.encode(data.dateActiveFull)}</div>
							</div>
							<a 
								href="${main_core.Text.encode(data.activatedBy.path)}"
								onclick="BX.SidePanel.Instance.open('${main_core.Text.encode(data.activatedBy.path)}')"
								title="${main_core.Text.encode(data.activatedBy.name)}"
								class="ui-icon ui-icon-common-user crm-webform-active-popup-item-avatar ${main_core.Text.encode(data.activatedBy.iconClass)}"
							>
								<i style="background-image: url(${encodeURI(main_core.Text.encode(data.activatedBy.iconPath))});"></i>
							</a>
						</div>
					`
					});
					popup.show();
				};
				node.appendChild(main_core.Tag.render`
				<div class="crm-webform-list-active-desc">
					${nodeText}
					<div>
						<a 
							class="crm-webform-list-active-more"
							onclick="${handler}"
						>${main_core.Loc.getMessage('CRM_WEBFORM_LIST_BTN_DETAILS')}</a>
					</div>
				</div>
			`);
			});
		}
		setGroupAction(code) {
			this.#groupAction = code;
		}
		runGroupAction() {
			switch (this.#groupAction) {
				case 'activate':
					this.activateList(true);
					return;
				case 'deactivate':
					this.activateList(false);
					return;
				case 'delete':
					this.removeList();
					return;
			}
			if (this.#groupAction) {
				throw new Error(`Wrong group action "${this.#groupAction}"`);
			}
		}
		showConfirm(code = 'delete') {
			code = code.toUpperCase();
			return new Promise((resolve, reject) => {
				ui_dialogs_messagebox.MessageBox.show({
					message: main_core.Loc.getMessage('CRM_WEBFORM_LIST_' + code + '_CONFIRM'),
					modal: true,
					title: main_core.Loc.getMessage('CRM_WEBFORM_LIST_' + code + '_CONFIRM_TITLE'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					onOk: messageBox => {
						messageBox.close();
						resolve();
					},
					onCancel: messageBox => {
						messageBox.close();
						reject();
					}
				});
			});
		}
		#getGrid() {
			return BX.Main.gridManager.getInstanceById(this.gridId);
		}
		#getGridContainer() {
			const grid = this.#getGrid();
			if (grid) {
				return grid.getContainer();
			}
		}
		reloadGrid() {
			const grid = this.#getGrid();
			if (grid) {
				return grid.reload();
			}
		}
		showGridLoader() {
			const grid = this.#getGrid();
			if (grid) {
				grid.getLoader().show();
			}
		}
		hideGridLoader() {
			const grid = this.#getGrid();
			if (grid) {
				grid.getLoader().hide();
			}
		}
		showNotification(message) {
			BX.UI.Notification.Center.notify({
				content: message
			});
		}
		remove(id) {
			this.showConfirm('delete').then(() => {
				this.showGridLoader();
				main_core.ajax.runAction('crm.form.delete', {
					json: {
						id
					}
				}).then(response => {
					if (response.data) {
						this.reloadGrid();
					} else {
						this.hideGridLoader();
						this.showNotification(main_core.Loc.getMessage('CRM_WEBFORM_LIST_DELETE_ERROR'));
					}
				}).catch(() => {
					this.hideGridLoader();
					this.showNotification(main_core.Loc.getMessage('CRM_WEBFORM_LIST_DELETE_ERROR'));
				});
			});
		}
		removeList() {
			this.showConfirm('delete').then(() => {
				const grid = this.#getGrid();
				if (grid) {
					this.#getGrid().removeSelected();
				}
			});
		}
		resetCounters(id) {
			this.showGridLoader();
			return main_core.ajax.runAction('crm.form.resetCounters', {
				json: {
					id
				}
			}).then(() => this.reloadGrid()).catch(() => {
				this.checkOnWriteAccessError(result);
				this.hideGridLoader();
			});
		}
		copy(id) {
			this.showGridLoader();
			return main_core.ajax.runAction('crm.form.copy', {
				json: {
					id
				}
			}).then(() => this.reloadGrid()).catch(() => {
				this.checkOnWriteAccessError(result);
				this.hideGridLoader();
			});
		}
		showSiteCode(id, options = {}, needVerify = false) {
			if (needVerify) {
				this.#verifyPhone(PHONE_VERIFY_FORM_ENTITY, id, () => {
					BX.Crm.Form.Embed.openSlider(id, options);
				});
			} else {
				BX.Crm.Form.Embed.openSlider(id, options);
			}
		}
		#verifyPhone(entityType, entityId, runOnVerified) {
			const sliderTitle = main_core.Loc.getMessage('CRM_WEBFORM_PHONE_VERIFY_CUSTOM_SLIDER_TITLE'),
				title = main_core.Loc.getMessage('CRM_WEBFORM_PHONE_VERIFY_CUSTOM_TITLE'),
				description = main_core.Loc.getMessage('CRM_WEBFORM_PHONE_VERIFY_CUSTOM_DESCRIPTION_V1');
			if (typeof bitrix24_phoneverify.PhoneVerify !== 'undefined') {
				bitrix24_phoneverify.PhoneVerify.getInstance().setEntityType(entityType).setEntityId(entityId).startVerify({
					sliderTitle: sliderTitle,
					title: title,
					description: description
				}).then(verified => {
					if (verified) {
						runOnVerified();
						this.reloadGrid();
					}
				});
			} else {
				runOnVerified();
			}
		}
		activateList(mode = true) {
			this.showGridLoader();
			const grid = this.#getGrid();
			if (!grid) {
				return;
			}
			const list = grid.getRows().getSelectedIds();
			main_core.ajax.runAction('crm.form.activateList', {
				json: {
					list,
					mode
				}
			}).then(() => this.reloadGrid()).catch(() => {
				this.checkOnWriteAccessError(result);
				this.hideGridLoader();
			});
		}
		activate(id, mode, reloadGrid = true, nodeText = null) {
			const switcher = BX.UI.Switcher.getById('crm-form-list-item-' + id);
			if (switcher) {
				switcher.setLoading(true);
				switcher.check(mode, false);
			}
			return main_core.ajax.runAction('crm.form.activate', {
				json: {
					id: parseInt(id),
					mode
				}
			}).then(() => {
				if (switcher) {
					nodeText.textContent = switcher.isChecked() ? BX.date.format(BX.date.convertBitrixFormat(BX.message("FORMAT_DATE"))) : main_core.Loc.getMessage('CRM_WEBFORM_LIST_NOT_ACTIVE');
					switcher.setLoading(false);
				}
				if (reloadGrid) {
					this.reloadGrid();
				}
			}).catch(result => {
				this.checkOnWriteAccessError(result);
				if (switcher) {
					switcher.setLoading(false);
					switcher.check(!switcher.isChecked(), false);
				}
			});
		}
		checkOnWriteAccessError(result) {
			const errors = result.errors;
			errors.forEach(error => {
				if (parseInt(error.code) === 2) {
					this.showNotification(main_core.Loc.getMessage('CRM_WEBFORM_LIST_ITEM_WRITE_ACCESS_DENIED'));
				}
				if (error.code === 'ERROR_CODE_PHONE_NOT_VERIFIED') {
					this.showNotification(main_core.Loc.getMessage('CRM_WEBFORM_LIST_ITEM_PHONE_NOT_VERIFIED'));
				}
			});
		}
	}
	BX.Crm.WebFormList = new WebFormList();

})(BX, BX.Main, BX.UI.Dialogs, BX.UI, BX.Bitrix24);
//# sourceMappingURL=script.js.map
