/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_designTokens, ui_fonts_opensans, clipboard, ui_switcher, ui_layoutForm, main_date, ui_buttons, main_popup) {
	'use strict';

	class Backend {
		static disableExternalLink(objectId) {
			return main_core.ajax.runAction('disk.api.commonActions.disableExternalLink', {
				data: {
					objectId: objectId
				}
			});
		}
		static generateExternalLink(objectId) {
			return main_core.ajax.runAction('disk.api.commonActions.generateExternalLink', {
				data: {
					objectId: objectId
				}
			});
		}
		static getExternalLink(objectId) {
			return main_core.ajax.runAction('disk.api.commonActions.getExternalLink', {
				data: {
					objectId: objectId
				}
			});
		}
		static setDeathTime(externalLinkId, deathTimeTimestamp) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.api.externalLink.setDeathTime', {
					data: {
						externalLinkId: externalLinkId,
						deathTime: deathTimeTimestamp
					}
				}).then(resolve, reject);
			});
		}
		static revokeDeathTime(externalLinkId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.api.externalLink.revokeDeathTime', {
					data: {
						externalLinkId: externalLinkId
					}
				}).then(resolve, reject);
			});
		}
		static setPassword(externalLinkId, newPassword) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.api.externalLink.setPassword', {
					data: {
						externalLinkId: externalLinkId,
						newPassword: newPassword
					}
				}).then(resolve, reject);
			});
		}
		static revokePassword(externalLinkId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.api.externalLink.revokePassword', {
					data: {
						externalLinkId: externalLinkId
					}
				}).then(resolve, reject);
			});
		}
		static allowEditDocument(externalLinkId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.api.externalLink.allowEditDocument', {
					data: {
						externalLinkId: externalLinkId
					}
				}).then(resolve, reject);
			});
		}
		static disallowEditDocument(externalLinkId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.api.externalLink.disallowEditDocument', {
					data: {
						externalLinkId: externalLinkId
					}
				}).then(resolve, reject);
			});
		}
	}
	class BackendForTrackedObject extends Backend {
		static disableExternalLink(objectId) {
			BX.ajax.runAction('disk.api.trackedObject.disableExternalLink', {
				data: {
					objectId: objectId
				}
			});
		}
		static generateExternalLink(objectId) {
			return main_core.ajax.runAction('disk.api.trackedObject.generateExternalLink', {
				data: {
					objectId: objectId
				}
			});
		}
		static getExternalLink(objectId) {
			return main_core.ajax.runAction('disk.api.trackedObject.getExternalLink', {
				data: {
					objectId: objectId
				}
			});
		}
	}
	class BackendForUnifiedLink extends Backend {
		static disableExternalLink(objectId) {
			BX.ajax.runAction('disk.api.UnifiedLinkActions.disableExternalLink', {
				data: {
					uniqueCode: objectId
				}
			});
		}
		static generateExternalLink(objectId) {
			return main_core.ajax.runAction('disk.api.UnifiedLinkActions.generateExternalLink', {
				data: {
					uniqueCode: objectId
				}
			});
		}
		static getExternalLink(objectId) {
			return main_core.ajax.runAction('disk.api.UnifiedLinkActions.getExternalLink', {
				data: {
					uniqueCode: objectId
				}
			});
		}
	}

	class Input {
		cache = new main_core.Cache.MemoryCache();
		data = {};
		constructor(objectId, data) {
			this.bindEvents();
			if (main_core.Type.isPlainObject(objectId)) {
				this.objectId = parseInt(objectId.objectId, 10);
				this.setData(objectId, false);
			} else {
				this.objectId = parseInt(objectId, 10);
				this.setData(data, false);
			}
		}
		setData(data, fireEvent = true) {
			if (data && main_core.Type.isPlainObject(data)) {
				this.data = Object.assign(this.data, data);
				this.data.id = this.data.id === null ? this.data.id : parseInt(this.data.id, 10);
			} else {
				this.data = {
					id: null,
					link: null,
					hash: null,
					hasPassword: null,
					hasDeathTime: null,
					availableEdit: null,
					canEditDocument: null,
					deathTime: null,
					deathTimeTimestamp: null
				};
			}
			this.adjustData();
			main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:DataSet', data);
			if (fireEvent !== false) {
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'Disk:ExternalLink:HasChanged', {
					objectId: this.objectId,
					data: this.data,
					target: this
				});
			}
		}
		adjustData() {
			if (this.data.id === null) {
				this.getSwitcher().check(false, false);
				this.showUnchecked();
			} else {
				this.getSwitcher().check(true, false);
				this.showChecked();
				this.getLinkContainer().innerHTML = main_core.Text.encode(this.data.link);
				this.getLinkContainer().href = main_core.Text.encode(this.data.link);
				this.getPasswordContainer().innerHTML = this.data.hasPassword ? main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_WITH_PASSWORD') : main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_WITHOUT_PASSWORD');
				this.getDeathTimeContainer().innerHTML = this.data.hasDeathTime ? main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_BEFORE').replace('#deathTime#', BX.Main.Date.format(BX.Main.Date.convertBitrixFormat(main_core.Loc.getMessage('FORMAT_DATETIME').replace(':SS', '')), new Date(this.data.deathTimeTimestamp * 1000))) : main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_FOREVER');
				if (this.data.availableEdit === true) {
					this.getRightsContainer().innerHTML = `, ${this.data.canEditDocument ? main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_RIGHTS_CAN_EDIT') : main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_RIGHTS_CAN_READ')}`;
					main_core.Dom.style(this.getRightsContainer(), 'display', '');
				} else {
					main_core.Dom.style(this.getRightsContainer(), 'display', 'none');
				}
			}
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'Disk:ExternalLink:HasChanged', ({
				data: {
					objectId,
					data,
					target
				}
			}) => {
				if (objectId !== this.objectId || Object.is(target, this)) {
					return;
				}
				this.setData(data, false);
			});
		}
		getBackend() {
			return Backend;
		}
		openSettingsPopup() {
			return this.constructor.showPopup(this.objectId, this.data);
		}
		getContainer() {
			return this.cache.remember('main', () => {
				const copyButton = main_core.Tag.render`<div class="disk-control-external-link-link-icon"></div>`;
				BX.clipboard.bindCopyClick(copyButton, {
					text: () => {
						return this.data.link;
					}
				});
				const tune = () => {
					return this.openSettingsPopup();
				};
				return main_core.Tag.render`
				<div class="disk-control-external-link-block${this.data.id === null ? '' : ' disk-control-external-link-block--active'}">
					<div class="disk-control-external-link">
						<div class="disk-control-external-link-btn">
							${this.getSwitcher().getNode()}
						</div>
						<div class="disk-control-external-link-main">
							<div class="disk-control-external-link-link-box">
								${this.getLinkContainer()}
								${copyButton}
							</div>
							<div class="disk-control-external-link-subtitle" onclick="${tune}">${this.getDeathTimeContainer()}<span>, </span>${this.getPasswordContainer()}${this.getRightsContainer()}</div>
							<div class="disk-control-external-link-text">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_IS_NOT_PUBLISHED')}</div>
							<div class="disk-control-external-link-skeleton"></div>
						</div>
					</div>
				</div>
			`;
			});
		}
		getSwitcher() {
			return this.cache.remember('switcher', () => {
				const switcherNode = document.createElement('span');
				switcherNode.className = 'ui-switcher';
				const switcher = new BX.UI.Switcher({
					node: switcherNode,
					checked: this.data.id !== null,
					inputName: 'ACTIVE',
					color: 'green'
				});
				switcher.handlers = {
					toggled: this.toggle.bind(this, {
						target: switcher
					})
				};
				return switcher;
			});
		}
		getLinkContainer() {
			return this.cache.remember('link', () => {
				return main_core.Tag.render`<a href="${main_core.Text.encode(this.data.link)}" class="disk-control-external-link-link" target="_blank">${main_core.Text.encode(this.data.link)}</a>`;
			});
		}
		getRightsContainer() {
			return this.cache.remember('rights', () => {
				return document.createElement('span');
			});
		}
		getDeathTimeContainer() {
			return this.cache.remember('deathTime', () => {
				return document.createElement('span');
			});
		}
		getPasswordContainer() {
			return this.cache.remember('password', () => {
				return document.createElement('span');
			});
		}
		getCanEditTextContainer() {
			return this.cache.remember('canEditText', () => {
				return main_core.Tag.render`<div class="ui-ctl-label-text">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_ALLOW_EDITING')}</div>`;
			});
		}
		toggle({
			target
		}) {
			if (target.isChecked()) {
				this.showLoader();
				void this.getBackend().generateExternalLink(this.objectId).then(({
					data: {
						externalLink
					}
				}) => {
					this.setData(externalLink);
					this.hideLoader();
				});
			} else {
				this.getBackend().disableExternalLink(this.objectId);
				this.setData(null);
			}
		}
		showChecked() {
			const baseClassName = this.getContainer().classList.item(0);
			const activeClassName = [baseClassName, '--active'].join('');
			main_core.Dom.addClass(this.getContainer(), activeClassName);
		}
		showUnchecked() {
			const baseClassName = this.getContainer().classList.item(0);
			const activeClassName = [baseClassName, '--active'].join('');
			main_core.Dom.removeClass(this.getContainer(), activeClassName);
		}
		showLoader() {
			main_core.Dom.addClass(this.getContainer(), 'disk-control-external-link-skeleton--active');
		}
		hideLoader() {
			main_core.Dom.removeClass(this.getContainer(), 'disk-control-external-link-skeleton--active');
		}
		reload() {
			this.showLoader();
			return this.getBackend().getExternalLink(this.objectId).then(({
				data
			}) => {
				this.setData(data && data.externalLink ? data.externalLink : null);
				this.hideLoader();
			});
		}
	}

	class InputExtended extends Input {
		constructor(objectId, data) {
			super(objectId, data);
		}
		adjustData() {
			if (this.data.id === null) {
				this.getSwitcher().check(false, false);
				this.showUnchecked();
				if (this.cache.get('popup')) {
					this.cache.get('popup').getPopupContainer().setAttribute('externalLinkIsSet', 'N');
				}
			} else {
				this.getSwitcher().check(true, false);
				this.showChecked();
				this.getLinkContainer().innerHTML = main_core.Text.encode(this.data.link);
				this.getLinkContainer().href = main_core.Text.encode(this.data.link);
				this.getPasswordContainer().innerHTML = this.data.hasPassword ? main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_WITH_PASSWORD') : main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_WITHOUT_PASSWORD');
				this.getDeathTimeContainer().innerHTML = this.data.hasDeathTime ? main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_BEFORE').replace('#deathTime#', BX.Main.Date.format(BX.Main.Date.convertBitrixFormat(main_core.Loc.getMessage('FORMAT_DATETIME').replace(':SS', '')), new Date(this.data.deathTimeTimestamp * 1000))) : main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_FOREVER');
				if (this.data.availableEdit === true) {
					this.getRightsContainer().innerHTML = ', ' + (this.data.canEditDocument ? main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_RIGHTS_CAN_EDIT') : main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_RIGHTS_CAN_READ'));
					this.getRightsContainer().style.display = '';
				} else {
					this.getRightsContainer().style.display = 'none';
				}
				if (this.cache.get('popup')) {
					this.cache.get('popup').getPopupContainer().setAttribute('externalLinkIsSet', 'Y');
				}
				if (this.data.isBoard) {
					this.getCanEditTextContainer().innerHTML = main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_ALLOW_EDITING_BOARD');
				}
			}
		}
		getContainer() {
			return this.cache.remember('main', () => {
				const copyButton = main_core.Tag.render`<div class="disk-control-external-link-link-icon"></div>`;
				BX.clipboard.bindCopyClick(copyButton, {
					text: () => {
						return this.data.link;
					}
				});
				this.showSettings = this.showSettings.bind(this);
				return main_core.Tag.render`
				<div class="disk-control-external-link-block${this.data.id !== null ? ' disk-control-external-link-block--active' : ''} disk-control-external-link-block--tunable">
					<div class="disk-control-external-link">
						<div class="disk-control-external-link-btn">
							${this.getSwitcher().getNode()}
						</div>
						<div class="disk-control-external-link-main">
							<div class="disk-control-external-link-link-box">
								${this.getLinkContainer()}
								${copyButton}
							</div>
							<div class="disk-control-external-link-subtitle" onclick="${this.showSettings}">${this.getDeathTimeContainer()}<span>, </span>${this.getPasswordContainer()}${this.getRightsContainer()}</div>
							<div class="disk-control-external-link-text">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_IS_NOT_PUBLISHED')}</div>
							<div class="disk-control-external-link-skeleton"></div>
						</div>
						<div class="disk-public-link-config" onclick="${this.showSettings}"></div>
					</div>
					<div class="disk-control-external-link-settings">
						${this.getDeathTimeSettingsContainer()}
						${this.getPasswordSettingsContainer()}
						${this.getEditSettingsContainer()}
					</div>
				</div>
			`;
			});
		}
		showSettings() {
			this.cache.set('settingsAreShown', 'Y');
			if (this.cache.get('popup')) {
				this.cache.get('popup').getPopupContainer().setAttribute('settingsAreShown', 'Y');
			}
		}
		hideSettings() {
			this.cache.set('settingsAreShown', 'N');
			if (this.cache.get('popup')) {
				this.cache.get('popup').getPopupContainer().setAttribute('settingsAreShown', 'N');
			}
		}
		getDeathTimeSettingsContainer() {
			return this.cache.remember('deathTimeSettings', () => {
				const deathTimeSettings = main_core.Tag.render`
			<div class="ui-form-line">
				<input type="checkbox" name="hasDeathTime">
				<div class="ui-form-row">
					<label class="ui-ctl ui-ctl-checkbox">
						<input type="checkbox" class="ui-ctl-element" name="enableDeathTime">
						<div class="ui-ctl-label-text">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_DEATHTIME_LIMIT_CHECKBOX')}</div>
					</label>
				</div>
				<div class="ui-form-row-inline" name="deathTimeIsNotSaved">
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-w25 ui-ctl-inline">
							<input type="number" min="1" name="deathTimeValue" class="ui-ctl-element" value="10" size="4">
						</div>
						<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-inline ui-ctl-w50">
							<div class="ui-ctl-after ui-ctl-icon-angle"></div>
							<select class="ui-ctl-element" name="deathTimeMeasure">
								<option value="60" selected>${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_MINUTES')}</option>
								<option value="3600">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_HOURS')}</option>
								<option value="86400">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_DAYS')}</option>
							</select>
						</div>
					</div>
				</div>
				<div class="ui-form-row-inline" name="deathTimeIsSaved">
					<div class="ui-form-label">
						<div class="ui-ctl-label-text">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_DEATHTIME_LIMIT_PREPOSITION')}</div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-after-icon ui-ctl-no-border">
							<div class="ui-ctl-element" name="deathTimeParsed">14.10.2014 16:33</div>
							<button name="deathTimeButtonUnset" class="ui-ctl-after ui-ctl-icon-clear"></button>
						</div>
					</div>
				</div>
			</div>`;

				/*region bind settings form */
				const onDeathTimeHasChanged = () => {
					if (!(this.data['id'] > 0)) {
						return;
					}
					if (deathTimeSettings.querySelector('input[name=enableDeathTime]').checked === true) {
						deathTimeSettings.querySelector('input[name=deathTimeValue]').disabled = false;
						deathTimeSettings.querySelector('[name=deathTimeMeasure]').disabled = false;
					} else {
						deathTimeSettings.querySelector('input[name=deathTimeValue]').disabled = true;
						deathTimeSettings.querySelector('input[name=deathTimeValue]').value = '10';
						deathTimeSettings.querySelector('[name=deathTimeMeasure]').disabled = true;
						deathTimeSettings.querySelector('[name=deathTimeMeasure]').value = '60';
					}
				};
				deathTimeSettings.querySelector('input[name=enableDeathTime]').addEventListener('click', () => {
					onDeathTimeHasChanged();
					deathTimeSettings.querySelector('input[name=enableDeathTime]').dataset.changed = 'Y';
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Change', {
						field: 'deathTime'
					});
				});
				deathTimeSettings.querySelector('button[name=deathTimeButtonUnset]').addEventListener('click', () => {
					deathTimeSettings.querySelector('input[name=hasDeathTime]').checked = false;
					deathTimeSettings.querySelector('input[name=enableDeathTime]').dataset.changed = 'Y';
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Change', {
						field: 'deathTime'
					});
				});
				const adjustSettings = () => {
					if (!(this.data['id'] > 0)) {
						return;
					}
					deathTimeSettings.querySelector('input[name=enableDeathTime]').dataset.changed = 'N';
					if (this.data['hasDeathTime']) {
						deathTimeSettings.querySelector('input[name=hasDeathTime]').checked = true;
						deathTimeSettings.querySelector('div[name=deathTimeParsed]').innerHTML = BX.Main.Date.format(BX.Main.Date.convertBitrixFormat(main_core.Loc.getMessage('FORMAT_DATETIME').replace(':SS', '')), new Date(this.data.deathTimeTimestamp * 1000));
						deathTimeSettings.querySelector('input[name=enableDeathTime]').checked = true;
					} else {
						deathTimeSettings.querySelector('input[name=hasDeathTime]').checked = false;
						deathTimeSettings.querySelector('input[name=enableDeathTime]').checked = false;
					}
					onDeathTimeHasChanged();
				};
				main_core_events.EventEmitter.subscribe(this, 'Disk:ExternalLink:DataSet', adjustSettings);
				adjustSettings();
				/*endregion*/

				return deathTimeSettings;
			});
		}
		getPasswordSettingsContainer() {
			return this.cache.remember('passwordSettings', () => {
				const passwordSettings = main_core.Tag.render`
			<div class="ui-form-line">
				<input type="checkbox" name="hasPassword">
				<div class="ui-form-row">
					<label class="ui-ctl ui-ctl-checkbox">
						<input type="checkbox" class="ui-ctl-element" name="enablePassword">
						<div class="ui-ctl-label-text">${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_PASSWORD_CHECKBOX')}</div>
					</label>
				</div>
				<div class="ui-form-row-inline" name="passwordIsNotSaved">
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon">
							<input type="password" name="passwordValue" class="ui-ctl-element" placeholder="${main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_PASSWORD_PLACEHOLDER')}" autocomplete="nope">
							<button class="ui-ctl-after ui-ctl-icon-angle disk-external-link-setting-popup-password-show" name="passwordTypeSwitcher"></button>
						</div>
					</div>
				</div>
				<div class="ui-form-row-inline" name="passwordIsSaved">
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-disabled ui-ctl-after-icon">
							<input type="password" class="ui-ctl-element" readonly value="some password">
							<button name="passwordButtonUnset" class="ui-ctl-after ui-ctl-icon-clear"></button>
						</div>
					</div>
				</div>
			</div>
			`;

				/*region bind settings form */
				const passwordValue = passwordSettings.querySelector('input[name=passwordValue]');
				const onPasswordHasChanged = () => {
					if (!(this.data['id'] > 0)) {
						return;
					}
					if (passwordSettings.querySelector('input[name=enablePassword]').checked === true) {
						passwordValue.disabled = false;
					} else {
						passwordValue.disabled = true;
						passwordValue.value = '';
						passwordValue.type = 'password';
					}
				};
				passwordSettings.querySelector('input[name=enablePassword]').addEventListener('click', () => {
					onPasswordHasChanged();
					passwordSettings.querySelector('input[name=enablePassword]').dataset.changed = 'Y';
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Change', {
						field: 'password'
					});
				});
				passwordSettings.querySelector('button[name=passwordButtonUnset]').addEventListener('click', () => {
					passwordSettings.querySelector('input[name=hasPassword]').checked = false;
					passwordSettings.querySelector('input[name=enablePassword]').dataset.changed = 'Y';
					passwordValue.value = '';
					passwordValue.type = 'password';
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Change', {
						field: 'password'
					});
				});
				passwordSettings.querySelector('button[name=passwordTypeSwitcher]').addEventListener('click', () => {
					passwordValue.type = passwordValue.type === 'text' ? 'password' : 'text';
				});
				const adjustSettings = () => {
					if (!(this.data['id'] > 0)) {
						return;
					}
					passwordSettings.querySelector('input[name=enablePassword]').dataset.changed = 'N';
					passwordSettings.querySelector('input[name=hasPassword]').checked = this.data['hasPassword'] === true;
					passwordSettings.querySelector('input[name=enablePassword]').checked = this.data['hasPassword'] === true;
					onPasswordHasChanged();
				};
				main_core_events.EventEmitter.subscribe(this, 'Disk:ExternalLink:DataSet', adjustSettings);
				adjustSettings();
				/*endregion*/

				return passwordSettings;
			});
		}
		getEditSettingsContainer() {
			return this.cache.remember('editSettings', () => {
				const editSettings = main_core.Tag.render`
			<div class="ui-form-line">
				<div class="ui-form-row">
					<label class="ui-ctl ui-ctl-checkbox">
						<input type="checkbox" class="ui-ctl-element" name="canEditDocument">
						${this.getCanEditTextContainer()}
					</label>
				</div>
			</div>
			`;
				/*region bind settings form */
				const canEditDocument = editSettings.querySelector('input[name=canEditDocument]');
				canEditDocument.addEventListener('click', () => {
					canEditDocument.dataset.changed = 'Y';
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Change', {
						field: 'canEditDocument'
					});
				});
				const adjustSettings = () => {
					canEditDocument.checked = this.data['canEditDocument'] === true;
					canEditDocument.dataset.changed = 'N';
					if (this.data['availableEdit'] !== true) {
						editSettings.style.display = 'none';
						canEditDocument.disable = true;
					} else {
						editSettings.style.display = '';
						delete editSettings.style.display;
						delete canEditDocument.disable;
					}
				};
				main_core_events.EventEmitter.subscribe(this, 'Disk:ExternalLink:DataSet', adjustSettings);
				adjustSettings();
				/*endregion*/

				return editSettings;
			});
		}
		saveSettings() {
			if (!(this.data.id > 0)) {
				return;
			}
			const settings = this.getContainer();
			/*region DeathTime */
			if (settings.querySelector('input[name=enableDeathTime]').dataset.changed === 'Y') {
				const deathTimer = parseInt(settings.querySelector('input[name=deathTimeValue]').value) * parseInt(settings.querySelector('[name=deathTimeMeasure]').value);
				const enableDeathTime = settings.querySelector('input[name=enableDeathTime]').checked === true && deathTimer > 0;
				if (enableDeathTime === true) {
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Save', () => {});
					const deathTimeTimestamp = Math.floor(Date.now() / 1000) + deathTimer;
					this.getBackend().setDeathTime(this.data.id, deathTimeTimestamp).then(({
						data: {
							externalLink: {
								hasDeathTime,
								deathTimeTimestamp,
								deathTime
							}
						}
					}) => {
						this.setData({
							hasDeathTime: hasDeathTime,
							deathTimeTimestamp: deathTimeTimestamp,
							deathTime: deathTime
						});
					}).finally(() => {
						main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Saved', () => {});
					});
				} else if (enableDeathTime !== this.data.hasDeathTime) {
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Save', () => {});
					this.getBackend().revokeDeathTime(this.data['id']).then(() => {
						this.setData({
							hasDeathTime: false,
							deathTimeTimestamp: null,
							deathTime: null
						});
					}).finally(() => {
						main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Saved', () => {});
					});
				}
			}
			/*endregion*/
			/*region Password*/
			if (settings.querySelector('input[name=enablePassword]').dataset.changed === 'Y') {
				const passwordValue = settings.querySelector('input[name=passwordValue]').value.trim();
				const enablePassword = settings.querySelector('input[name=enablePassword]').checked === true && passwordValue.length > 0;
				if (enablePassword === true) {
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Save', () => {});
					this.getBackend().setPassword(this.data['id'], passwordValue).then(() => {
						this.setData({
							hasPassword: true
						});
					}).finally(() => {
						main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Saved', () => {});
					});
				} else if (enablePassword !== this.data.hasPassword) {
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Save', () => {});
					this.getBackend().revokePassword(this.data['id']).then(() => {
						this.setData({
							hasPassword: false
						});
					}).finally(() => {
						main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Saved', () => {});
					});
				}
			}
			/*endregion*/
			/*region editing rights */
			const canEditDocumentNode = settings.querySelector('input[name=canEditDocument]');
			if (canEditDocumentNode && canEditDocumentNode.dataset.changed === 'Y' && canEditDocumentNode.checked !== this.data.canEditDocument) {
				if (canEditDocumentNode.checked) {
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Save', () => {});
					this.getBackend().allowEditDocument(this.data['id']).then(() => {
						this.setData({
							canEditDocument: true
						});
					}).finally(() => {
						main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Saved', () => {});
					});
				} else {
					main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Save', () => {});
					this.getBackend().disallowEditDocument(this.data['id']).then(() => {
						this.setData({
							canEditDocument: false
						});
					}).finally(() => {
						main_core_events.EventEmitter.emit(this, 'Disk:ExternalLink:Settings:Saved', () => {});
					});
				}
			}
			/*endregion*/
		}
		getPopup() {
			return this.cache.remember('popup', () => {
				const popupSave = new ui_buttons.SaveButton({
					state: ui_buttons.ButtonState.DISABLED,
					onclick: () => {
						this.saveSettings();
					}
				});
				popupSave.saveCounter = 0;
				main_core_events.EventEmitter.subscribe(this, 'Disk:ExternalLink:Settings:Save', () => {
					this.cache.get('popup').getPopupContainer().setAttribute('externalLinkIsWaiting', 'Y');
					popupSave.saveCounter++;
					popupSave.setWaiting();
				});
				main_core_events.EventEmitter.subscribe(this, 'Disk:ExternalLink:Settings:Saved', () => {
					popupSave.saveCounter--;
					if (popupSave.saveCounter <= 0) {
						this.cache.get('popup').getPopupContainer().setAttribute('externalLinkIsWaiting', 'N');
						popupSave.setDisabled(true);
					}
				});
				main_core_events.EventEmitter.subscribe(this, 'Disk:ExternalLink:Settings:Change', () => {
					popupSave.setDisabled(false);
				});
				main_core_events.EventEmitter.subscribe(this, 'Disk:ExternalLink:DataSet', () => {
					popupSave.setDisabled(true);
				});
				const popup = new main_popup.Popup({
					uniquePopupId: 'disk-external-link',
					className: 'disk-external-link-popup',
					titleBar: main_core.Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_TITLE'),
					content: this.getContainer(),
					autoHide: true,
					closeIcon: true,
					closeByEsc: true,
					overlay: true,
					cacheable: false,
					minWidth: 410,
					events: {
						onClose: () => {
							this.cache.delete('popup');
						}
					},
					buttons: [popupSave, new ui_buttons.CloseButton({
						events: {
							click: function () {
								popup.close();
							}
						}
					})]
				});
				popup.getPopupContainer().setAttribute('externalLinkIsSet', this.data.id > 0 ? 'Y' : 'N');
				popup.getPopupContainer().setAttribute('settingsAreShown', this.cache.get('settingsAreShown') === 'Y' ? 'Y' : 'N');
				return popup;
			});
		}
		show() {
			this.getPopup().show();
		}
	}

	class InputSimple extends Input {
		constructor(objectId, data) {
			super(objectId, data);
		}
		static getExtendedInputClass() {
			return InputExtended;
		}
		static showPopup(objectId, data = null) {
			const className = this.getExtendedInputClass();
			const res = new className(objectId, data);
			if (data === null) {
				res.reload();
			} else
				// This behaviour is appropriate for current task
				{
					res.showSettings();
				}
			res.show();
		}
	}

	class InputExtendedForTrackedObject extends InputExtended {
		getBackend() {
			return BackendForTrackedObject;
		}
	}

	class InputSimpleForTrackedObject extends InputSimple {
		constructor(objectId, data) {
			super(objectId, data);
		}
		getBackend() {
			return BackendForTrackedObject;
		}
		openSettingsPopup() {
			void main_core.Runtime.loadExtension('disk.sharing-access-popup').then(({
				SharingPopupDialog
			}) => {
				const realObjectId = parseInt(this.data?.objectId, 10);
				if (!realObjectId) {
					this.constructor.showPopup(this.objectId, this.data);
					return;
				}
				const popup = new SharingPopupDialog();
				popup.open({
					objectId: realObjectId,
					initialTab: 'public',
					onAfterHide: () => {
						void this.reload();
					}
				});
			}).catch(() => {
				this.constructor.showPopup(this.objectId, this.data);
			});
		}
		static getExtendedInputClass() {
			return InputExtendedForTrackedObject;
		}
	}

	class InputExtendedForUnifiedLink extends InputExtended {
		constructor(objectId, data) {
			super(objectId, data);
			this.objectId = objectId; // override for unified link, since here objectId is unique code represented as a string
		}
		getBackend() {
			return BackendForUnifiedLink;
		}
	}

	class InputSimpleForUnifiedLink extends InputSimple {
		constructor(objectId, data) {
			super(objectId, data);
		}
		getBackend() {
			return BackendForUnifiedLink;
		}
		static getExtendedInputClass() {
			return InputExtendedForUnifiedLink;
		}
	}

	exports.ExternalLink = InputSimple;
	exports.ExternalLinkForTrackedObject = InputSimpleForTrackedObject;
	exports.ExternalLinkForUnifiedLink = InputSimpleForUnifiedLink;

})(this.BX.Disk = this.BX.Disk || {}, BX, BX.Event, BX, BX, BX, BX.UI, BX.UI, BX.Main, BX.UI, BX.Main);
//# sourceMappingURL=external-link.bundle.js.map
