import { Tag, Dom, Event, Loc, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { DateTimeFormat } from 'main.date';
import { Dialog } from 'ui.system.dialog';
import { Input, PasswordInput, InputSize, InputDesign } from 'ui.system.input';
import { Button, ButtonSize, AirButtonStyle } from 'ui.buttons';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { Center as NotificationCenter } from 'ui.notification';

import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';
import { resolveErrorHtml } from 'biconnector.error-message';

import { subscribeToAdminDisable, type ShareAdminDisable } from './share-admin-disable-pull';
import './share-popup.css';

const ERROR_SHARE_FORBIDDEN = 'share_forbidden';
const ERROR_SHARE_DISABLED_BY_ADMIN = 'share_disabled_by_admin';

export type ShareDisabledByAdmin = {
	id: number,
	name: string,
	dateTimestamp: ?number,
};

export type SharePopupOptions = {
	dashboardId: number,
	dashboardTitle?: string,
	onCopyLink?: Function,
	embeddedLoader?: Object,
	initialShareData?: ?Object,
	urlParams?: ?Object,
	type?: string,
	analyticsElement?: string,
};

export class SharePopup
{
	#dialog: Dialog;
	#dashboardId: number;
	#isEnabled: boolean = false;
	#shareData: ?Object = null;
	#wasEverActivated: boolean = false;
	#isApplyingInitialData: boolean = false;

	#toggleInput: HTMLInputElement;
	#descriptionNode: HTMLElement;
	#formNode: HTMLElement;
	#hintNode: HTMLElement;
	#footerNode: HTMLElement;
	#adminStatusNode: HTMLElement;
	#adminStatusTextNode: HTMLElement;
	#enableButton: Button;
	#iconWrapper: HTMLElement;
	#iconNode: HTMLElement;

	#dateInput: Input;
	#datePicker: DatePicker;
	#selectedDate: ?Date = null;
	#passwordInput: PasswordInput;
	#copyButton: Button;
	#savedPassword: string = '';
	#initialDataApplied: boolean = false;

	#onCopyLink: ?Function;
	#embeddedLoader: ?Object;
	#urlParams: ?Object;
	#passwordDebounceTimer: ?number = null;
	#type: string = '';
	#analyticsElement: string = '';
	#dashboardTitle: string = '';
	#disabledByAdmin: ?ShareDisabledByAdmin = null;
	#isBanned: boolean = false;
	#unsubscribeAdminDisable: ?Function = null;

	constructor(options: SharePopupOptions = {})
	{
		this.#dashboardId = options.dashboardId;
		this.#dashboardTitle = options.dashboardTitle ?? '';
		this.#onCopyLink = options.onCopyLink ?? null;
		this.#embeddedLoader = options.embeddedLoader ?? null;
		this.#urlParams = options.urlParams ?? null;
		this.#shareData = options.initialShareData ?? null;
		this.#disabledByAdmin = this.#shareData?.disabledByAdmin ?? null;
		this.#isBanned = this.#shareData?.isBanned === true;
		this.#type = options.type ?? '';
		this.#analyticsElement = options.analyticsElement ?? '';
	}

	#sendAnalytics(event: string, extraParams: Object = {}): void
	{
		ApacheSupersetAnalytics.sendAnalytics('share', event, {
			type: this.#type,
			c_element: 'sharing_pop_up',
			...extraParams,
		});
	}

	show(): void
	{
		this.#sendAnalytics('open_sharing_pop_up', {
			c_element: this.#analyticsElement,
			status: 'success',
		});

		const content = this.#renderContent();

		if (!this.#initialDataApplied)
		{
			this.#initialDataApplied = true;
			this.#applyShareData();
		}

		this.#restoreState();

		this.#dialog = new Dialog({
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
					this.#savedPassword = this.#passwordInput.getValue();
					this.#dialog = null;
					this.#unsubscribeAdminDisable?.();
					this.#unsubscribeAdminDisable = null;
				},
			},
		});

		this.#dialog.show();
		this.#unsubscribeAdminDisable ??= subscribeToAdminDisable(
			this.#dashboardId,
			(disable) => this.#applyAdminDisable(disable),
		);
	}

	#applyShareData(): void
	{
		if (!this.#shareData)
		{
			return;
		}

		if (this.#isShareExpired())
		{
			this.#shareData = null;

			return;
		}

		this.#isApplyingInitialData = true;

		this.#isEnabled = this.#shareData.isActive === true;
		// A stored link keeps its password and date, so switching it on again is a plain activation
		this.#wasEverActivated = Type.isStringFilled(this.#shareData.password);

		if (this.#shareData.password)
		{
			this.#savedPassword = this.#shareData.password;
		}

		if (this.#shareData.dateExpireTimestamp)
		{
			this.#selectedDate = new Date(this.#shareData.dateExpireTimestamp * 1000);
		}

		this.#isApplyingInitialData = false;
	}

	#isShareExpired(): boolean
	{
		if (!this.#shareData?.dateExpireTimestamp)
		{
			return false;
		}

		return this.#shareData.dateExpireTimestamp * 1000 < Date.now();
	}

	#restoreState(): void
	{
		this.#isApplyingInitialData = true;

		this.#toggleInput.checked = this.#isEnabled;
		this.#updateState();

		if (this.#savedPassword)
		{
			this.#passwordInput.setValue(this.#savedPassword);
		}

		if (this.#selectedDate)
		{
			this.#datePicker.selectDates([this.#selectedDate]);
			this.#dateInput.setValue(this.#formatDate(this.#selectedDate));
		}

		this.#isApplyingInitialData = false;
	}

	hide(): void
	{
		if (this.#dialog)
		{
			this.#dialog.hide();
		}
	}

	#renderContent(): HTMLElement
	{
		this.#descriptionNode = Tag.render`
			<div class="biconnector-share-popup__description">
				${Loc.getMessage('BICONNECTOR_SHARE_POPUP_DISABLED_DESC')}
			</div>
		`;

		this.#formNode = Tag.render`
			<div class="biconnector-share-popup__form biconnector-share-popup__form--hidden">
				${this.#renderDateField()}
				${this.#renderPasswordField()}
			</div>
		`;

		this.#hintNode = Tag.render`
			<div class="biconnector-share-popup__hint biconnector-share-popup__hint--hidden">
				${Loc.getMessage('BICONNECTOR_SHARE_POPUP_FILTER_HINT')}
			</div>
		`;

		this.#iconWrapper = Tag.render`
			<div class="biconnector-share-popup__icon-wrapper biconnector-share-popup__icon-wrapper--disabled">
				<div class="biconnector-share-popup__icon biconnector-share-popup__icon--disabled"></div>
			</div>
		`;
		this.#iconNode = this.#iconWrapper.querySelector('.biconnector-share-popup__icon');

		this.#copyButton = new Button({
			text: Loc.getMessage('BICONNECTOR_SHARE_POPUP_COPY_LINK'),
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			icon: 'o-link',
			onclick: this.#handleCopyLink.bind(this),
		});

		this.#footerNode = Tag.render`
			<div class="biconnector-share-popup__footer biconnector-share-popup__footer--hidden">
				${this.#copyButton.render()}
			</div>
		`;

		return Tag.render`
			<div class="biconnector-share-popup" style="
				--share-popup-icon: url('${this.#getImagePath('link-icon.webp')}');
			">
				${this.#renderHeader()}
				<div class="biconnector-share-popup__card">
					<div class="biconnector-share-popup__toggle-section">
						${this.#renderToggleRow()}
						${this.#renderAdminStatus()}
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

	#renderHeader(): HTMLElement
	{
		const closeBtn = Tag.render`
			<div class="biconnector-share-popup__close ui-icon-set --cross-l"></div>
		`;

		Event.bind(closeBtn, 'click', () => this.hide());

		const titleNode = Tag.render`<div class="biconnector-share-popup__title"></div>`;
		titleNode.textContent = Loc.getMessage('BICONNECTOR_SHARE_POPUP_TITLE')
			.replace('#NAME#', this.#dashboardTitle);

		return Tag.render`
			<div class="biconnector-share-popup__header">
				${titleNode}
				${closeBtn}
			</div>
		`;
	}

	#renderToggleRow(): HTMLElement
	{
		this.#toggleInput = Tag.render`
			<input type="checkbox" class="biconnector-share-popup__toggle-input" ${this.#isEnabled ? 'checked' : ''}>
		`;

		Event.bind(this.#toggleInput, 'change', this.#handleToggleChange.bind(this));

		return Tag.render`
			<div class="biconnector-share-popup__toggle-row">
				<label class="biconnector-share-popup__toggle">
					${this.#toggleInput}
					<span class="biconnector-share-popup__toggle-slider"></span>
				</label>
				<span class="biconnector-share-popup__toggle-label">
					${Loc.getMessage('BICONNECTOR_SHARE_POPUP_PUBLIC_LINK')}
				</span>
			</div>
		`;
	}

	#renderAdminStatus(): HTMLElement
	{
		this.#adminStatusTextNode = Tag.render`<div class="biconnector-share-popup__admin-status-text"></div>`;

		this.#enableButton = new Button({
			text: Loc.getMessage('BICONNECTOR_SHARE_POPUP_ENABLE'),
			size: ButtonSize.SMALL,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			className: 'biconnector-share-popup__admin-status-enable',
			onclick: () => this.#enableFromAdminStatus(),
		});

		this.#adminStatusNode = Tag.render`
			<div class="biconnector-share-popup__admin-status --hidden">
				${this.#adminStatusTextNode}
				${this.#enableButton.render()}
			</div>
		`;

		return this.#adminStatusNode;
	}

	#getAdminStatusText(): string
	{
		if (this.#isBanned)
		{
			return Loc.getMessage('BICONNECTOR_SHARE_POPUP_BANNED');
		}

		if (!this.#disabledByAdmin)
		{
			return '';
		}

		const { name, dateTimestamp } = this.#disabledByAdmin;
		if (!dateTimestamp)
		{
			return Loc.getMessage('BICONNECTOR_SHARE_POPUP_DISABLED_BY_ADMIN_NO_DATE', { '#NAME#': name });
		}

		return Loc.getMessage('BICONNECTOR_SHARE_POPUP_DISABLED_BY_ADMIN', {
			'#NAME#': name,
			'#DATE#': DateTimeFormat.format(DateTimeFormat.getFormat('LONG_DATE_FORMAT'), dateTimestamp),
		});
	}

	#enableFromAdminStatus(): void
	{
		this.#toggleInput.checked = true;
		this.#handleToggleChange();
	}

	#onShareEnabled(): void
	{
		this.#disabledByAdmin = null;
	}

	#applyAdminDisable({ isBanned, disabledByAdmin }: ShareAdminDisable): void
	{
		if (this.#passwordDebounceTimer)
		{
			clearTimeout(this.#passwordDebounceTimer);
			this.#passwordDebounceTimer = null;
		}

		const wasEnabled = this.#isEnabled;
		this.#isEnabled = false;
		this.#isBanned = this.#isBanned || isBanned;
		this.#disabledByAdmin = disabledByAdmin ?? this.#disabledByAdmin;

		if (this.#toggleInput)
		{
			this.#toggleInput.checked = false;
			this.#updateState();
		}

		if (wasEnabled)
		{
			EventEmitter.emit('BIConnector.SharePopup:onShareDeactivated', {
				dashboardId: this.#dashboardId,
			});
		}
	}

	/**
	 * A save that met a link switched off by an administrator or a ban shows it as the pull event would.
	 */
	#applyAdminRejection(response: Object): boolean
	{
		const errors = Type.isArray(response?.errors) ? response.errors : [];
		const disabledError = errors.find((error) => error?.code === ERROR_SHARE_DISABLED_BY_ADMIN);
		if (disabledError)
		{
			this.#applyAdminDisable({
				isBanned: false,
				disabledByAdmin: disabledError.customData?.disabledByAdmin ?? null,
			});

			return true;
		}

		if (errors.some((error) => error?.code === ERROR_SHARE_FORBIDDEN))
		{
			this.#applyAdminDisable({ isBanned: true, disabledByAdmin: null });

			return true;
		}

		return false;
	}

	#renderDateField(): HTMLElement
	{
		this.#dateInput = new Input({
			label: Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_LABEL'),
			placeholder: Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_PLACEHOLDER'),
			size: InputSize.Md,
			design: InputDesign.Grey,
			icon: 'o-calendar-with-slots',
			clickable: true,
			onClick: this.#handleDateClick.bind(this),
		});

		this.#datePicker = new DatePicker({
			selectionMode: 'single',
			enableTime: true,
			timePickerStyle: 'wheel',
			defaultTime: '23:59:00',
		});

		this.#datePicker.subscribe(DatePickerEvent.SELECT, ({ data }) => {
			this.#handleDateSelect(data.date);
		});

		const rendered = this.#dateInput.render();

		const labelNode = rendered.querySelector('.ui-system-input-label');
		if (labelNode)
		{
			Dom.addClass(labelNode, 'biconnector-share-popup__field-label--required');
		}

		return Tag.render`
			<div class="biconnector-share-popup__field">
				${rendered}
			</div>
		`;
	}

	#renderPasswordField(): HTMLElement
	{
		this.#passwordInput = new PasswordInput({
			label: Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_LABEL'),
			placeholder: Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_PLACEHOLDER'),
			size: InputSize.Md,
			design: InputDesign.Grey,
			copyable: true,
			onInput: () => {
				this.#handlePasswordInput();
			},
		});

		const rendered = this.#passwordInput.render();

		const labelNode = rendered.querySelector('.ui-system-input-label');
		if (labelNode)
		{
			Dom.addClass(labelNode, 'biconnector-share-popup__field-label--required');
		}

		const generateBtn = Tag.render`
			<button
				type="button"
				class="biconnector-share-popup__generate-btn"
				title="${Loc.getMessage('BICONNECTOR_SHARE_POPUP_GENERATE_PASSWORD')}"
			>
				<span class="ui-icon-set --key"></span>
			</button>
		`;

		Event.bind(generateBtn, 'click', () => this.#generatePassword());

		return Tag.render`
			<div class="biconnector-share-popup__field biconnector-share-popup__field--with-action">
				${rendered}
				${generateBtn}
			</div>
		`;
	}

	#generatePassword(): void
	{
		const length = 12;
		const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		const values = new Uint32Array(length);
		crypto.getRandomValues(values);

		let password = '';
		for (let i = 0; i < length; i++)
		{
			password += charset[values[i] % charset.length];
		}

		this.#passwordInput.setValue(password);
		this.#passwordInput.setError('');
		this.#copyButton.setDisabled(false);

		NotificationCenter.notify({
			content: Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_GENERATED'),
		});

		if (this.#isEnabled && this.#wasEverActivated)
		{
			this.#autoSaveChanges();
		}
		else
		{
			this.#tryInitialCreate();
		}
	}

	#handleToggleChange(): void
	{
		// Ignore change events during initial data application
		if (this.#isApplyingInitialData)
		{
			return;
		}

		const wasEnabled = this.#isEnabled;
		this.#isEnabled = this.#toggleInput.checked;
		this.#updateState();

		if (wasEnabled && !this.#isEnabled)
		{
			this.#deactivateShare();
		}
		else if (!wasEnabled && this.#isEnabled && this.#wasEverActivated)
		{
			// Re-enabling previously activated share - save immediately
			this.#activateShare();
		}
	}

	#activateShare(): void
	{
		// Re-activating with existing data - no validation needed
		const password = this.#passwordInput.getValue();
		const dateEnd = this.#selectedDate ? this.#formatDateForServer(this.#selectedDate) : '';

		BX.ajax.runAction('biconnector.dashboard.createShare', {
			data: {
				id: this.#dashboardId,
				password,
				dateEnd,
				externalFilterValuesJson: null,
				urlParameterValues: this.#urlParams,
			},
		})
			.then(() => {
				this.#onShareEnabled();
				this.#sendAnalytics('activate_public_link', { status: 'success' });
				EventEmitter.emit('BIConnector.SharePopup:onShareActivated', {
					dashboardId: this.#dashboardId,
				});
			})
			.catch((response) => {
				this.#sendAnalytics('activate_public_link', { status: 'error' });

				// Rollback toggle on error
				this.#toggleInput.checked = false;
				this.#isEnabled = false;
				this.#updateState();

				NotificationCenter.notify({
					content: resolveErrorHtml(response, Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_ACTIVATE')),
				});
			});
	}

	#deactivateShare(): void
	{
		BX.ajax.runAction('biconnector.dashboard.deactivateShare', {
			data: {
				id: this.#dashboardId,
			},
		})
			.then(() => {
				this.#sendAnalytics('activate_public_link', { status: 'success' });
				EventEmitter.emit('BIConnector.SharePopup:onShareDeactivated', {
					dashboardId: this.#dashboardId,
				});
			})
			.catch((response) => {
				this.#sendAnalytics('activate_public_link', { status: 'error' });

				// Rollback toggle on error
				this.#toggleInput.checked = true;
				this.#isEnabled = true;
				this.#updateState();

				NotificationCenter.notify({
					content: resolveErrorHtml(response, Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_DEACTIVATE')),
				});
			});
	}

	#updateState(): void
	{
		const showAdminStatus = !this.#isEnabled && (this.#disabledByAdmin !== null || this.#isBanned);
		Dom.toggleClass(this.#adminStatusNode, '--hidden', !showAdminStatus);
		this.#adminStatusTextNode.textContent = this.#getAdminStatusText();
		Dom.toggleClass(this.#enableButton.getContainer(), '--hidden', this.#isBanned);
		this.#toggleInput.disabled = this.#isBanned && !this.#isEnabled;

		if (this.#isEnabled)
		{
			this.#descriptionNode.textContent = Loc.getMessage('BICONNECTOR_SHARE_POPUP_ENABLED_DESC')
				.replaceAll('[nbsp]', '\u00A0');
			Dom.removeClass(this.#formNode, 'biconnector-share-popup__form--hidden');
			Dom.removeClass(this.#hintNode, 'biconnector-share-popup__hint--hidden');
			Dom.removeClass(this.#footerNode, 'biconnector-share-popup__footer--hidden');

			Dom.removeClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--disabled');
			Dom.addClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--enabled');

			Dom.removeClass(this.#iconNode, 'biconnector-share-popup__icon--disabled');
			Dom.addClass(this.#iconNode, 'biconnector-share-popup__icon--enabled');

			const hasInvalidPassword = this.#validatePassword() !== null;
			const hasNoDate = !this.#selectedDate;
			this.#copyButton.setDisabled(hasInvalidPassword || hasNoDate);
		}
		else
		{
			this.#descriptionNode.textContent = Loc.getMessage('BICONNECTOR_SHARE_POPUP_DISABLED_DESC');
			Dom.addClass(this.#formNode, 'biconnector-share-popup__form--hidden');
			Dom.addClass(this.#hintNode, 'biconnector-share-popup__hint--hidden');
			Dom.addClass(this.#footerNode, 'biconnector-share-popup__footer--hidden');

			Dom.removeClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--enabled');
			Dom.addClass(this.#iconWrapper, 'biconnector-share-popup__icon-wrapper--disabled');

			Dom.removeClass(this.#iconNode, 'biconnector-share-popup__icon--enabled');
			Dom.addClass(this.#iconNode, 'biconnector-share-popup__icon--disabled');
		}
	}

	#handleDateClick(): void
	{
		const inputContainer = this.#dateInput.render().querySelector('.ui-system-input-container');
		this.#datePicker.getPopup().setBindElement(inputContainer);
		this.#datePicker.show();
	}

	#handleDateSelect(date: Date): void
	{
		const now = new Date();
		const localNowUtc = Date.UTC(
			now.getFullYear(), now.getMonth(), now.getDate(),
			now.getHours(), now.getMinutes(), now.getSeconds(),
		);
		const startOfTodayUtc = Date.UTC(
			now.getFullYear(), now.getMonth(), now.getDate(),
		);

		this.#dateInput.setValue(this.#formatDate(date));

		if (date.getTime() < startOfTodayUtc)
		{
			this.#dateInput.setError(Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_PAST'));
			this.#copyButton.setDisabled(true);

			return;
		}

		if (date.getTime() < localNowUtc)
		{
			this.#dateInput.setError(Loc.getMessage('BICONNECTOR_SHARE_POPUP_TIME_PAST'));
			this.#copyButton.setDisabled(true);

			return;
		}

		this.#selectedDate = date;
		this.#dateInput.setError('');
		this.#copyButton.setDisabled(this.#validatePassword() !== null);

		if (this.#isEnabled && this.#wasEverActivated && !this.#isApplyingInitialData)
		{
			this.#autoSaveChanges();
		}
		else
		{
			this.#tryInitialCreate();
		}
	}

	#formatDate(date: Date): string
	{
		const lang = Loc.getMessage('LANGUAGE_ID') || 'en';

		return date.toLocaleString(lang, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'UTC',
		});
	}

	#formatDateForServer(date: Date): string
	{
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');
		const hours = String(date.getUTCHours()).padStart(2, '0');
		const minutes = String(date.getUTCMinutes()).padStart(2, '0');
		const seconds = String(date.getUTCSeconds()).padStart(2, '0');

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	#validatePassword(): ?string
	{
		const password = this.#passwordInput.getValue();

		if (!password)
		{
			return Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_REQUIRED');
		}

		if (password.length < 8)
		{
			return Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_TOO_SHORT');
		}

		if (password.length > 32)
		{
			return Loc.getMessage('BICONNECTOR_SHARE_POPUP_PASSWORD_TOO_LONG');
		}

		return null;
	}

	#handlePasswordInput(): void
	{
		// Clear existing timer
		if (this.#passwordDebounceTimer)
		{
			clearTimeout(this.#passwordDebounceTimer);
		}

		const error = this.#validatePassword();
		this.#passwordInput.setError(error ?? '');
		this.#copyButton.setDisabled(!!error || !this.#selectedDate);

		if (this.#isEnabled && this.#wasEverActivated && !this.#isApplyingInitialData && !error)
		{
			this.#passwordDebounceTimer = setTimeout(() => {
				this.#autoSaveChanges();
			}, 800);
		}
		else if (!error)
		{
			this.#passwordDebounceTimer = setTimeout(() => {
				this.#tryInitialCreate();
			}, 800);
		}
	}

	async #tryInitialCreate(): void
	{
		if (this.#wasEverActivated || !this.#isEnabled || this.#isApplyingInitialData)
		{
			return;
		}

		const password = this.#passwordInput.getValue();
		if (!password || this.#validatePassword() !== null || !this.#selectedDate)
		{
			return;
		}

		let externalFilterValues = null;
		if (this.#embeddedLoader && Type.isFunction(this.#embeddedLoader.getExternalFilterValues))
		{
			try
			{
				externalFilterValues = await this.#embeddedLoader.getExternalFilterValues();
			}
			catch (err)
			{
				console.warn('Failed to get external filter values:', err);
			}
		}

		BX.ajax.runAction('biconnector.dashboard.createShare', {
			data: {
				id: this.#dashboardId,
				password,
				dateEnd: this.#formatDateForServer(this.#selectedDate),
				externalFilterValuesJson: externalFilterValues ? JSON.stringify(externalFilterValues) : null,
				urlParameterValues: this.#urlParams,
			},
		})
			.then(() => {
				this.#wasEverActivated = true;
				this.#onShareEnabled();

				this.#sendAnalytics('activate_public_link', { status: 'success' });
				EventEmitter.emit('BIConnector.SharePopup:onShareActivated', {
					dashboardId: this.#dashboardId,
				});
			})
			.catch((response) => {
				NotificationCenter.notify({
					content: resolveErrorHtml(response, Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_ACTIVATE')),
				});
			});
	}

	#autoSaveChanges(): void
	{
		const password = this.#passwordInput.getValue();
		const dateEnd = this.#selectedDate ? this.#formatDateForServer(this.#selectedDate) : '';

		if (!this.#isEnabled || !password || this.#validatePassword() !== null)
		{
			return;
		}

		BX.ajax.runAction('biconnector.dashboard.createShare', {
			data: {
				id: this.#dashboardId,
				password,
				dateEnd,
				externalFilterValuesJson: null,
				urlParameterValues: this.#urlParams,
				autoSave: 'Y',
			},
		})
			.then(() => {})
			.catch((response) => {
				if (this.#applyAdminRejection(response))
				{
					return;
				}

				NotificationCenter.notify({
					content: resolveErrorHtml(response, Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_SAVE')),
				});
			});
	}

	async #handleCopyLink(): void
	{
		let hasError = false;

		if (!this.#selectedDate)
		{
			this.#dateInput.setError(Loc.getMessage('BICONNECTOR_SHARE_POPUP_DATE_REQUIRED'));
			hasError = true;
		}

		const passwordError = this.#validatePassword();
		if (passwordError)
		{
			this.#passwordInput.setError(passwordError);
			hasError = true;
		}

		if (hasError)
		{
			return;
		}

		this.#copyButton.setWaiting(true);

		let externalFilterValues = null;
		if (this.#embeddedLoader && Type.isFunction(this.#embeddedLoader.getExternalFilterValues))
		{
			try
			{
				externalFilterValues = await this.#embeddedLoader.getExternalFilterValues();
			}
			catch (err)
			{
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
				urlParameterValues: this.#urlParams,
				// Copying a link already on is not a request to switch it on again.
				autoSave: this.#wasEverActivated ? 'Y' : 'N',
			},
		})
			.then((response) => {
				this.#copyButton.setWaiting(false);

				// Mark as activated after first successful save
				this.#wasEverActivated = true;
				this.#onShareEnabled();

				const shareUrl = response.data.url;
				this.#copyToClipboard(shareUrl);

				this.#sendAnalytics('copy_link', { status: 'success' });

				this.#onCopyLink?.(shareUrl);

				EventEmitter.emit('BIConnector.SharePopup:onShareActivated', {
					dashboardId: this.#dashboardId,
				});
			})
			.catch((response) => {
				this.#copyButton.setWaiting(false);

				this.#sendAnalytics('copy_link', { status: 'error' });

				if (this.#applyAdminRejection(response))
				{
					return;
				}

				NotificationCenter.notify({
					content: resolveErrorHtml(response, Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR_ACTIVATE')),
				});
			});
	}

	#copyToClipboard(text: string): void
	{
		if (navigator.clipboard && window.isSecureContext)
		{
			navigator.clipboard.writeText(text)
				.then(() => this.#showCopySuccess())
				.catch(() => this.#copyToClipboardFallback(text));
		}
		else
		{
			this.#copyToClipboardFallback(text);
		}
	}

	#copyToClipboardFallback(text: string): void
	{
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-9999px';
		document.body.appendChild(textArea);
		textArea.select();

		try
		{
			if (document.execCommand('copy'))
			{
				this.#showCopySuccess();

				return;
			}
		}
		catch
		{}
		finally
		{
			document.body.removeChild(textArea);
		}

		NotificationCenter.notify({
			content: Loc.getMessage('BICONNECTOR_SHARE_POPUP_ERROR'),
		});
	}

	#showCopySuccess(): void
	{
		NotificationCenter.notify({
			content: Loc.getMessage('BICONNECTOR_SHARE_POPUP_LINK_COPIED'),
		});
	}

	#getImagePath(filename: string): string
	{
		return `/bitrix/js/biconnector/share-popup/src/images/${filename}`;
	}
}
