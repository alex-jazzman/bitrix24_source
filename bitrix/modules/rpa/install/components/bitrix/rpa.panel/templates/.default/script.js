/* eslint-disable */
(function (main_core, rpa_manager, main_popup, ui_dialogs_messagebox) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Rpa');
	class PanelItem extends BX.TileGrid.Item {
		constructor(options) {
			super(options);
			this.typeId = options.typeId;
			this.title = options.title;
			this.image = options.image;
			this.listUrl = options.listUrl;
			this.canDelete = options.canDelete === true;
			this.tasksCounter = options.tasksCounter;
			this.isSettingsRestricted = options.isSettingsRestricted === true;
		}
		isNew() {
			return this.id === 'rpa-type-new';
		}
		getContent() {
			if (!this.layout.container) {
				if (this.isNew()) {
					this.layout.container = main_core.Tag.render`
					<div class="rpa-tile-item rpa-tile-item-add-new" onclick="${this.onClick.bind(this)}">
						<div class="rpa-tile-item-content">
							<span class="rpa-tile-item-add-new-inner">
								<span class="rpa-tile-item-add-icon"></span>
								<span class="rpa-tile-item-add-text">${main_core.Loc.getMessage('RPA_COMMON_NEW_PROCESS')}</span>
							</span>
						</div>
					</div>
				`;
				} else {
					this.layout.container = main_core.Tag.render`
					<div class="rpa-tile-item" onclick="${this.onClick.bind(this)}">
						<div class="rpa-tile-item-content">
							<div class="rpa-tile-item-subject">
								${this.getTitle()}
								${this.getButton()}
							</div>
							${this.getImage()}
							${this.getStatus()}
							${this.getCounter()}
						</div>
					</div>
				`;
				}
			}
			return this.layout.container;
		}
		removeNode() {
			if (this.layout.container && this.layout.container.parentNode) {
				this.layout.container.parentNode.removeChild(this.layout.container);
			}
		}
		getButton() {
			if (!this.layout.button) {
				this.layout.button = main_core.Tag.render`
					<div class="rpa-tile-item-button" onclick="${this.showActions.bind(this)}">
						<div class="rpa-tile-item-button-inner">${main_core.Loc.getMessage('RPA_COMMON_BUTTON_ACTIONS')}</div>
					</div>
				`;
			}
			return this.layout.button;
		}
		getImage() {
			if (!this.layout.image) {
				this.layout.image =
				/*Tag.render`
					<div class="rpa-tile-item-image-block">
						<span class="rpa-tile-item-image fa fa-plane"></span>
						<span class="rpa-tile-item-image" style="background-image: url(&quot;https://cdn.bitrix24.site/bitrix/images/landing/business/1920x1080/img6.jpg&quot;);"></span>
					</div>
				`;*/
				main_core.Tag.render`
					<div class="rpa-tile-item-image-block">
						<div class="rpa-tile-item-image rpa-tile-item-icon-${main_core.Text.encode(this.image)}"></div>
					</div>
				`;
			}
			return this.layout.image;
		}
		getStatus() {
			if (!this.layout.status) {
				this.layout.status = main_core.Tag.render`
					<div class="rpa-tile-item-status"></div>
				`;
			}
			return this.layout.status;
		}
		getCounter() {
			if (!this.layout.counter) {
				this.layout.counter = main_core.Tag.render`
					<span id="rpa-type-list-${this.typeId}-counter" class="rpa-tile-item-counter" ${this.tasksCounter <= 0 ? 'style="display: none;"' : ''}>${this.tasksCounter}</span>
				`;
			}
			return this.layout.counter;
		}
		getTitle() {
			if (!this.layout.title) {
				this.layout.title = main_core.Tag.render`
					<div class="rpa-tile-item-text">${main_core.Text.encode(this.title)}</div>
				`;
			}
			return this.layout.title;
		}
		updateLayout() {
			this.getTitle().innerText = this.title;
			const imageNode = this.getImage().querySelector('.rpa-tile-item-image');
			if (!imageNode) {
				return;
			}
			imageNode.classList.forEach(className => {
				if (className.match('rpa-tile-item-icon-')) {
					imageNode.classList.remove(className);
				}
				imageNode.classList.add('rpa-tile-item-icon-' + main_core.Text.encode(this.image));
			});
		}
		onClick() {
			if (this.isNew()) {
				if (this.gridTile.options.isCreateTypeRestricted) {
					rpa_manager.Manager.Instance.showFeatureSlider();
					return;
				}
				this.openSettings().then(slider => {
					const sliderData = slider.getData();
					const response = sliderData.get('response');
					if (response && response.status === 'success') {
						rpa_manager.Manager.Instance.openKanban(response.data.type.id);
					} else {
						const data = sliderData.get('type');
						if (main_core.Type.isPlainObject(data) && data.typeId && data.typeId > 0) {
							//this.gridTile.appendItem(data);
							main_core.ajax.runAction('rpa.Type.delete', {
								data: {
									id: data.typeId
								}
							});
						}
					}
				});
			} else {
				this.goToList();
			}
		}
		showActions(event) {
			event.preventDefault();
			event.stopPropagation();
			main_popup.PopupMenu.show({
				id: this.id,
				bindElement: this.getButton(),
				items: this.getActions(),
				offsetLeft: 0,
				offsetTop: 0,
				closeByEsc: true,
				className: 'rpa-item-actions',
				cacheable: false
			});
		}
		closeActions() {
			main_popup.PopupMenu.destroy(this.id);
		}
		getActions() {
			const self = this;
			const actions = [{
				text: main_core.Loc.getMessage('RPA_COMMON_LIST'),
				onclick: () => {
					self.goToList();
					this.closeActions();
				}
			}, {
				text: main_core.Loc.getMessage('RPA_COMMON_ACTION_SETTINGS'),
				onclick: () => {
					this.closeActions();
					if (this.isSettingsRestricted) {
						rpa_manager.Manager.Instance.showFeatureSlider();
						return;
					}
					this.openSettings().then(slider => {
						if (!slider) {
							return;
						}
						const response = slider.getData().get('response');
						if (response && response.data && main_core.Type.isPlainObject(response.data.type)) {
							this.image = response.data.type.image;
							this.title = response.data.type.title;
							this.updateLayout();
						}
					});
				}
			}, {
				text: main_core.Loc.getMessage('RPA_COMMON_STAGES'),
				onclick: () => {
					if (this.isSettingsRestricted) {
						rpa_manager.Manager.Instance.showFeatureSlider();
					} else {
						rpa_manager.Manager.Instance.openStageList(this.typeId);
					}
				}
			}, {
				text: main_core.Loc.getMessage('RPA_COMMON_FIELDS_SETTINGS'),
				onclick: () => {
					if (this.isSettingsRestricted) {
						rpa_manager.Manager.Instance.showFeatureSlider();
					} else {
						rpa_manager.Manager.Instance.openFieldsList(this.typeId);
					}
				}
			}];
			if (this.canDelete) {
				actions.push({
					text: main_core.Loc.getMessage('RPA_COMMON_ACTION_DELETE'),
					onclick: () => {
						this.closeActions();
						if (this.gridTile.getLoader().isShown()) {
							return;
						}
						ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('RPA_PANEL_DELETE_CONFIRM_TEXT'), main_core.Loc.getMessage('RPA_PANEL_DELETE_CONFIRM_TITLE'), () => {
							return self.delete();
						});
					}
				});
			}
			return actions;
		}
		openSettings() {
			if (this.isNew()) {
				return rpa_manager.Manager.Instance.openTypeDetail(0, {
					allowChangeHistory: false
				});
			}
			return rpa_manager.Manager.Instance.openTypeDetail(this.typeId);
		}
		openStages() {
			return rpa_manager.Manager.Instance.openStageList(this.typeId);
		}
		delete() {
			return new Promise(resolve => {
				if (this.gridTile.getLoader().isShown()) {
					resolve();
				}
				this.gridTile.getLoader().show();
				main_core.ajax.runAction('rpa.Type.delete', {
					analyticsLabel: 'rpaPanelDeleteType',
					data: {
						id: this.typeId
					}
				}).then(response => {
					this.gridTile.getLoader().hide();
					this.gridTile.removeItem(this);
					resolve();
				}).catch(response => {
					this.gridTile.getLoader().hide();
					let message = '';
					response.errors.forEach(error => {
						message += error.message;
					});
					PanelItem.showError(message);
					resolve();
				});
			});
		}
		goToList() {
			if (this.listUrl) {
				location.href = this.listUrl;
			}
		}
		static getErrorNode() {
			return document.getElementById('rpa-panel-error-container');
		}
		static showError(message) {
			PanelItem.getErrorNode().innerText = message;
			if (message.length > 0) {
				PanelItem.getErrorNode().parentNode.style.display = 'block';
			} else {
				PanelItem.getErrorNode().parentNode.style.display = 'none';
			}
		}
	}
	namespace.PanelItem = PanelItem;

})(BX, BX.Rpa, BX.Main, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
