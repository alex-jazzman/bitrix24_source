/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_system_dialog, ui_system_input, ui_buttons, ui_datePicker, biconnector_apacheSupersetAnalytics) {
	'use strict';

	class SharePopup {
		#dialog;
		#dashboardId;
		#isEnabled = false;
		#shareData = null;
		#wasEverActivated = false;
		#isApplyingInitialData = false;
		#toggleInput;
		#descriptionNode;
		#formNode;
		#hintNode;
		#footerNode;
		#iconWrapper;
		#iconNode;
		#dateInput;
		#datePicker;
		#selectedDate = null;
		#passwordInput;
		#copyButton;
		#savedPassword = '';
		#initialDataApplied = false;
		#onCopyLink;
		#embeddedLoader;
		#urlParams;
		#passwordDebounceTimer = null;
		#type = '';
		#analyticsElement = '';
		#dashboardTitle = '';
		constructor(options = {}) {
			this.#dashboardId = options.dashboardId;
			this.#dashboardTitle = options.dashboardTitle ?? '';
			this.#onCopyLink = options.onCopyLink ?? null;
			this.#embeddedLoader = options.embeddedLoader ?? null;
			this.#urlParams = options.urlParams ?? null;
			this.#shareData = options.initialShareData ?? null;
			this.#type = options.type ?? '';
			this.#analyticsElement = options.analyticsElement ?? '';
		}
		#sendAnalytics(event, extraParams = {}) {
			biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('share', event, {
				type: this.#type,
				c_element: 'sharing_pop_up',
				...extraParams
			});
		}
		show() {
			this.#sendAnalytics('open_sharing_pop_up', {
				c_element: this.#analyticsElement,
				status: 'success'
			});
			const content = this.#renderContent();
			if (!this.#initialDataApplied) {
				this.#initialDataApplied = true;
				this.#applyShareData();
			}
			this.#restoreState();
			this.#dialog = new ui_system_dialog.Dialog({
				content,
				width: 550,
				hasOverlay: true,
				hasCloseButton: false,
				closeByClickOutside: true,
				closeByEsc: true,
				hasVerticalPadding: false,
				hasHorizontalPadding: false,
				events: {
					onHide: () => {
						if (!this.#isEnabled) {
							this.#savedPassword = '';
							this.#selectedDate = null;
							this.#wasEverActivated = false;
							this.#deleteOwnShare();
						} else if (!this.#validatePassword()) {
							this.#savedPassword = this.#passwordInput.getValue();
						}
						this.#dialog = null;
					}
				}
			});
			this.#dialog.show();
		}
		#applyShareData() {
			if (!this.#shareData) {
				return;
			}
			if (this.#isShareExpired()) {
				this.#shareData = null;
				return;
			}
			this.#isApplyingInitialData = true;
			if (this.#shareData.isActive) {
				this.#isEnabled = true;
				this.#wasEverActivated = true;
			}
			if (this.#shareData.password) {
				this.#savedPassword = this.#shareData.password;
			}
			if (this.#shareData.dateExpireTimestamp) {
				this.#selectedDate = new Date(this.#shareData.dateExpireTimestamp * 1000);
			}
			this.#isApplyingInitialData = false;
		}
		#isShareExpired() {
			if (!this.#shareData?.dateExpireTimestamp) {
				return false;
			}
			return this.#shareData.dateExpireTimestamp * 1000 < Date.now();
		}
		#restoreState() {
			this.#isApplyingInitialData = true;
			this.#toggleInput.checked = this.#isEnabled;
			this.#updateState();
			if (this.#savedPassword) {
				this.#passwordInput.setValue(this.#savedPassword);
			}
			if (this.#selectedDate) {
				this.#datePicker.selectDates([this.#selectedDate]);
				this.#dateInput.setValue(this.#formatDate(this.#selectedDate));
			}
			this.#isApplyingInitialData = false;
		}
		hide() {
			if (this.#dialog) {
				this.#dialog.hide();
			}
		}
		#renderContent() {
			this.#descriptionNode = main_core.Tag.render`
			<div class="biconnector-share-popup__description">
				${main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_DISABLED_DESC')}
			</div>
		`;
			this.#formNode = main_core.Tag.render`
			<div class="biconnector-share-popup__form biconnector-share-popup__form--hidden">
				${this.#renderDateField()}
				${this.#renderPasswordField()}
			</div>
		`;
			this.#hintNode = main_core.Tag.render`
			<div class="biconnector-share-popup__hint biconnector-share-popup__hint--hidden">
				${main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_FILTER_HINT')}
			</div>
		`;
			this.#iconWrapper = main_core.Tag.render`
			<div class="biconnector-share-popup__icon-wrapper biconnector-share-popup__icon-wrapper--disabled">
				<div class="biconnector-share-popup__icon biconnector-share-popup__icon--disabled"></div>
			</div>
		`;
			this.#iconNode = this.#iconWrapper.querySelector('.biconnector-share-popup__icon');
			this.#copyButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_COPY_LINK'),
				size: ui_buttons.ButtonSize.MEDIUM,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				icon: 'o-link',
				onclick: this.#handleCopyLink.bind(this)
			});
			this.#footerNode = main_core.Tag.render`
			<div class="biconnector-share-popup__footer biconnector-share-popup__footer--hidden">
				${this.#copyButton.render()}
			</div>
		`;
			return main_core.Tag.render`
			<div class="biconnector-share-popup" style="
				--share-popup-icon: url('${this.#getImagePath('link-icon.png')}');
			">
				${this.#renderHeader()}
				<div class="biconnector-share-popup__card">
					<div class="biconnector-share-popup__toggle-section">
						${this.#renderToggleRow()}
					</div>
					<div class="biconnector-share-popup__body">
						<div class="biconnector-share-popup__content">
							${this.#descriptionNode}
							${this.#formNode}
						</div>
						${this.#iconWrapper}
					</div>
					${this.#hintNode}
				</div>
				${this.#footerNode}
			</div>
		`;
		}
		#renderHeader() {
			const closeBtn = main_core.Tag.render`
			<div class="biconnector-share-popup__close ui-icon-set --cross-l"></div>
		`;
			main_core.Event.bind(closeBtn, 'click', () => this.hide());
			const titleNode = main_core.Tag.render`<div class="biconnector-share-popup__title"></div>`;
			titleNode.textContent = main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_TITLE').replace('#NAME#', this.#dashboardTitle);
			return main_core.Tag.render`
			<div class="biconnector-share-popup__header">
				${titleNode}
				${closeBtn}
			</div>
		`;
		}
		#renderToggleRow() {
			this.#toggleInput = main_core.Tag.render`
			<input type="checkbox" class="biconnector-share-popup__toggle-input" ${this.#isEnabled ? 'checked' : ''}>
		`;
			main_core.Event.bind(this.#toggleInput, 'change', this.#handleToggleChange.bind(this));
			return main_core.Tag.render`
			<div class="biconnector-share-popup__toggle-row">
				<label class="biconnector-share-popup__toggle">
					${this.#toggleInput}
					<span class="biconnector-share-popup__toggle-slider"></span>
				</label>
				<span class="biconnector-share-popup__toggle-label">
					${main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_PUBLIC_LINK')}
				</span>
			</div>
		`;
		}
		#renderDateField() {
			this.#dateInput = new ui_system_input.Input({
				label: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_LABEL'),
				placeholder: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_PLACEHOLDER'),
				size: ui_system_input.InputSize.Md,
				design: ui_system_input.InputDesign.Grey,
				icon: 'o-calendar-with-slots',
				clickable: true,
				onClick: this.#handleDateClick.bind(this)
			});
			this.#datePicker = new ui_datePicker.DatePicker({
				selectionMode: 'single',
				enableTime: true,
				timePickerStyle: 'wheel',
				defaultTime: '23:59:00'
			});
			this.#datePicker.subscribe(ui_datePicker.DatePickerEvent.SELECT, ({
				data
			}) => {
				this.#handleDateSelect(data.date);
			});
			const rendered = this.#dateInput.render();
			const labelNode = rendered.querySelector('.ui-system-input-label');
			if (labelNode) {
				main_core.Dom.addClass(labelNode, 'biconnector-share-popup__field-label--required');
			}
			return main_core.Tag.render`
			<div class="biconnector-share-popup__field">
				${rendered}
			</div>
		`;
		}
		#renderPasswordField() {
			this.#passwordInput = new ui_system_input.PasswordInput({
				label: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_LABEL'),
				placeholder: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_PLACEHOLDER'),
				size: ui_system_input.InputSize.Md,
				design: ui_system_input.InputDesign.Grey,
				copyable: true,
				onInput: () => {
					this.#handlePasswordInput();
				}
			});
			const rendered = this.#passwordInput.render();
			const labelNode = rendered.querySelector('.ui-system-input-label');
			if (labelNode) {
				main_core.Dom.addClass(labelNode, 'biconnector-share-popup__field-label--required');
			}
			const generateBtn = main_core.Tag.render`
			<button
				type="button"
				class="biconnector-share-popup__generate-btn"
				title="${main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_GENERATE_PASSWORD')}"
			>
				<span class="ui-icon-set --key"></span>
			</button>
		`;
			main_core.Event.bind(generateBtn, 'click', () => this.#generatePassword());
			return main_core.Tag.render`
			<div class="biconnector-share-popup__field biconnector-share-popup__field--with-action">
				${rendered}
				${generateBtn}
			</div>
		`;
		}
		#generatePassword() {
			const length = 12;
			const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
			const values = new Uint32Array(length);
			crypto.getRandomValues(values);
			let password = '';
			for (let i = 0; i < length; i++) {
				password += charset[values[i] % charset.length];
			}
			this.#passwordInput.setValue(password);
			this.#passwordInput.setError('');
			this.#copyButton.setDisabled(false);
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_GENERATED')
			});
			if (this.#isEnabled && this.#wasEverActivated) {
				this.#autoSaveChanges();
			} else {
				this.#tryInitialCreate();
			}
		}
		#handleToggleChange() {
			// Ignore change events during initial data application
			if (this.#isApplyingInitialData) {
				return;
			}
			const wasEnabled = this.#isEnabled;
			this.#isEnabled = this.#toggleInput.checked;
			this.#updateState();
			if (wasEnabled && !this.#isEnabled) {
				this.#deactivateShare();
			} else if (!wasEnabled && this.#isEnabled && this.#wasEverActivated) {
				// Re-enabling previously activated share - save immediately
				this.#activateShare();
			}
		}
		#activateShare() {
			// Re-activating with existing data - no validation needed
			const password = this.#passwordInput.getValue();
			const dateEnd = this.#selectedDate ? this.#formatDateForServer(this.#selectedDate) : '';
			BX.ajax.runAction('biconnector.dashboard.createShare', {
				data: {
					id: this.#dashboardId,
					password,
					dateEnd,
					externalFilterValuesJson: null,
					urlParameterValues: this.#urlParams
				}
			}).then(() => {
				this.#sendAnalytics('activate_public_link', {
					status: 'success'
				});
				main_core_events.EventEmitter.emit('BIConnector.SharePopup:onShareActivated', {
					dashboardId: this.#dashboardId
				});
			}).catch(() => {
				this.#sendAnalytics('activate_public_link', {
					status: 'error'
				});

				// Rollback toggle on error
				this.#toggleInput.checked = false;
				this.#isEnabled = false;
				this.#updateState();
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_ACTIVATE')
				});
			});
		}
		#deactivateShare() {
			BX.ajax.runAction('biconnector.dashboard.deactivateShare', {
				data: {
					id: this.#dashboardId
				}
			}).then(() => {
				this.#sendAnalytics('activate_public_link', {
					status: 'success'
				});
				main_core_events.EventEmitter.emit('BIConnector.SharePopup:onShareDeactivated', {
					dashboardId: this.#dashboardId
				});
			}).catch(() => {
				this.#sendAnalytics('activate_public_link', {
					status: 'error'
				});

				// Rollback toggle on error
				this.#toggleInput.checked = true;
				this.#isEnabled = true;
				this.#updateState();
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_DEACTIVATE')
				});
			});
		}
		#deleteOwnShare() {
			BX.ajax.runAction('biconnector.dashboard.deleteOwnShare', {
				data: {
					id: this.#dashboardId
				}
			});
		}
		#updateState() {
			if (this.#isEnabled) {
				this.#descriptionNode.textContent = main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_ENABLED_DESC').replaceAll('[nbsp]', '\u00A0');
				main_core.Dom.removeClass(this.#formNode, 'biconnector-share-popup__form--hidden');
				main_core.Dom.removeClass(this.#hintNode, 'biconnector-share-popup__hint--hidden');
				main_core.Dom.removeClass(this.#footerNode, 'biconnector-share-popup__footer--hidden');
				main_core.Dom.removeClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--disabled');
				main_core.Dom.addClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--enabled');
				main_core.Dom.removeClass(this.#iconNode, 'biconnector-share-popup__icon--disabled');
				main_core.Dom.addClass(this.#iconNode, 'biconnector-share-popup__icon--enabled');
				const hasInvalidPassword = this.#validatePassword() !== null;
				const hasNoDate = !this.#selectedDate;
				this.#copyButton.setDisabled(hasInvalidPassword || hasNoDate);
			} else {
				this.#descriptionNode.textContent = main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_DISABLED_DESC');
				main_core.Dom.addClass(this.#formNode, 'biconnector-share-popup__form--hidden');
				main_core.Dom.addClass(this.#hintNode, 'biconnector-share-popup__hint--hidden');
				main_core.Dom.addClass(this.#footerNode, 'biconnector-share-popup__footer--hidden');
				main_core.Dom.removeClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--enabled');
				main_core.Dom.addClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--disabled');
				main_core.Dom.removeClass(this.#iconNode, 'biconnector-share-popup__icon--enabled');
				main_core.Dom.addClass(this.#iconNode, 'biconnector-share-popup__icon--disabled');
			}
		}
		#handleDateClick() {
			const inputContainer = this.#dateInput.render().querySelector('.ui-system-input-container');
			this.#datePicker.getPopup().setBindElement(inputContainer);
			this.#datePicker.show();
		}
		#handleDateSelect(date) {
			const now = new Date();
			const localNowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
			const startOfTodayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
			this.#dateInput.setValue(this.#formatDate(date));
			if (date.getTime() < startOfTodayUtc) {
				this.#dateInput.setError(main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_PAST'));
				this.#copyButton.setDisabled(true);
				return;
			}
			if (date.getTime() < localNowUtc) {
				this.#dateInput.setError(main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_TIME_PAST'));
				this.#copyButton.setDisabled(true);
				return;
			}
			this.#selectedDate = date;
			this.#dateInput.setError('');
			this.#copyButton.setDisabled(this.#validatePassword() !== null);
			if (this.#isEnabled && this.#wasEverActivated && !this.#isApplyingInitialData) {
				this.#autoSaveChanges();
			} else {
				this.#tryInitialCreate();
			}
		}
		#formatDate(date) {
			const lang = main_core.Loc.getMessage('LANGUAGE_ID') || 'en';
			return date.toLocaleString(lang, {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'UTC'
			});
		}
		#formatDateForServer(date) {
			const year = date.getUTCFullYear();
			const month = String(date.getUTCMonth() + 1).padStart(2, '0');
			const day = String(date.getUTCDate()).padStart(2, '0');
			const hours = String(date.getUTCHours()).padStart(2, '0');
			const minutes = String(date.getUTCMinutes()).padStart(2, '0');
			const seconds = String(date.getUTCSeconds()).padStart(2, '0');
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
		}
		#validatePassword() {
			const password = this.#passwordInput.getValue();
			if (!password) {
				return main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_REQUIRED');
			}
			if (password.length < 8) {
				return main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_TOO_SHORT');
			}
			if (password.length > 32) {
				return main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_TOO_LONG');
			}
			return null;
		}
		#handlePasswordInput() {
			// Clear existing timer
			if (this.#passwordDebounceTimer) {
				clearTimeout(this.#passwordDebounceTimer);
			}
			const error = this.#validatePassword();
			this.#passwordInput.setError(error ?? '');
			this.#copyButton.setDisabled(!!error || !this.#selectedDate);
			if (this.#isEnabled && this.#wasEverActivated && !this.#isApplyingInitialData && !error) {
				this.#passwordDebounceTimer = setTimeout(() => {
					this.#autoSaveChanges();
				}, 800);
			} else if (!error) {
				this.#passwordDebounceTimer = setTimeout(() => {
					this.#tryInitialCreate();
				}, 800);
			}
		}
		async #tryInitialCreate() {
			if (this.#wasEverActivated || !this.#isEnabled || this.#isApplyingInitialData) {
				return;
			}
			const password = this.#passwordInput.getValue();
			if (!password || this.#validatePassword() !== null || !this.#selectedDate) {
				return;
			}
			let externalFilterValues = null;
			if (this.#embeddedLoader && main_core.Type.isFunction(this.#embeddedLoader.getExternalFilterValues)) {
				try {
					externalFilterValues = await this.#embeddedLoader.getExternalFilterValues();
				} catch (err) {
					console.warn('Failed to get external filter values:', err);
				}
			}
			BX.ajax.runAction('biconnector.dashboard.createShare', {
				data: {
					id: this.#dashboardId,
					password,
					dateEnd: this.#formatDateForServer(this.#selectedDate),
					externalFilterValuesJson: externalFilterValues ? JSON.stringify(externalFilterValues) : null,
					urlParameterValues: this.#urlParams
				}
			}).then(() => {
				this.#wasEverActivated = true;
				this.#sendAnalytics('activate_public_link', {
					status: 'success'
				});
				main_core_events.EventEmitter.emit('BIConnector.SharePopup:onShareActivated', {
					dashboardId: this.#dashboardId
				});
			}).catch(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_ACTIVATE')
				});
			});
		}
		#autoSaveChanges() {
			const password = this.#passwordInput.getValue();
			const dateEnd = this.#selectedDate ? this.#formatDateForServer(this.#selectedDate) : '';
			if (!password || this.#validatePassword() !== null) {
				return;
			}
			BX.ajax.runAction('biconnector.dashboard.createShare', {
				data: {
					id: this.#dashboardId,
					password,
					dateEnd,
					externalFilterValuesJson: null,
					urlParameterValues: this.#urlParams
				}
			}).then(() => {}).catch(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_SAVE')
				});
			});
		}
		async #handleCopyLink() {
			let hasError = false;
			if (!this.#selectedDate) {
				this.#dateInput.setError(main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_REQUIRED'));
				hasError = true;
			}
			const passwordError = this.#validatePassword();
			if (passwordError) {
				this.#passwordInput.setError(passwordError);
				hasError = true;
			}
			if (hasError) {
				return;
			}
			this.#copyButton.setWaiting(true);
			let externalFilterValues = null;
			if (this.#embeddedLoader && main_core.Type.isFunction(this.#embeddedLoader.getExternalFilterValues)) {
				try {
					externalFilterValues = await this.#embeddedLoader.getExternalFilterValues();
				} catch (err) {
					console.warn('Failed to get external filter values:', err);
				}
			}
			const password = this.#passwordInput.getValue();
			BX.ajax.runAction('biconnector.dashboard.createShare', {
				data: {
					id: this.#dashboardId,
					password,
					dateEnd: this.#selectedDate ? this.#formatDateForServer(this.#selectedDate) : '',
					externalFilterValuesJson: externalFilterValues ? JSON.stringify(externalFilterValues) : null,
					urlParameterValues: this.#urlParams
				}
			}).then(response => {
				this.#copyButton.setWaiting(false);

				// Mark as activated after first successful save
				this.#wasEverActivated = true;
				const shareUrl = response.data.url;
				this.#copyToClipboard(shareUrl);
				this.#sendAnalytics('copy_link', {
					status: 'success'
				});
				this.#onCopyLink?.(shareUrl);
				main_core_events.EventEmitter.emit('BIConnector.SharePopup:onShareActivated', {
					dashboardId: this.#dashboardId
				});
			}).catch(() => {
				this.#copyButton.setWaiting(false);
				this.#sendAnalytics('copy_link', {
					status: 'error'
				});
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_ACTIVATE')
				});
			});
		}
		#copyToClipboard(text) {
			if (navigator.clipboard && window.isSecureContext) {
				navigator.clipboard.writeText(text).then(() => this.#showCopySuccess()).catch(() => this.#copyToClipboardFallback(text));
			} else {
				this.#copyToClipboardFallback(text);
			}
		}
		#copyToClipboardFallback(text) {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			textArea.style.position = 'fixed';
			textArea.style.left = '-9999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				if (document.execCommand('copy')) {
					this.#showCopySuccess();
					return;
				}
			} catch {} finally {
				document.body.removeChild(textArea);
			}
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR')
			});
		}
		#showCopySuccess() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BICONNECTOR_SHARE_POPUP_LINK_COPIED')
			});
		}
		#getImagePath(filename) {
			return `/bitrix/js/biconnector/share-popup/src/images/${filename}`;
		}
	}

	exports.SharePopup = SharePopup;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Event, BX.UI.System, BX.UI.System.Input, BX.UI, BX.UI.DatePicker, BX.BIConnector);
