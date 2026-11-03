/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core, main_loader, ui_vue3, ui_system_alert, ui_system_alert_vue, ui_system_typography_vue, ui_vue3_components_button, ui_switcher, ui_vue3_components_switcher, main_popup, ui_select, ui_a11y, mail_signature_editor, ui_system_input_vue, ui_datePicker) {
	'use strict';

	const CONTROLLER = 'mail.api.vacationautoreply';
	const ACTION_GET = `${CONTROLLER}.get`;
	const ACTION_SAVE = `${CONTROLLER}.save`;
	const transport = main_core.ajax;
	function toRequestFlag(value) {
		return value === 1 || value === true ? 1 : 0;
	}
	function buildSavePayload(request) {
		return {
			mailboxId: request.mailboxId,
			active: toRequestFlag(request.active),
			startsAt: request.startsAt,
			endsAt: request.endsAt,
			timezoneId: request.timezoneId,
			body: request.body
		};
	}
	function toSetting(raw) {
		return {
			mailboxId: main_core.Text.toInteger(raw?.mailboxId),
			active: raw?.active === true,
			startsAt: toBound(raw?.startsAt),
			endsAt: toBound(raw?.endsAt),
			timezoneId: String(raw?.timezoneId ?? ''),
			body: String(raw?.body ?? ''),
			canEdit: raw?.canEdit === true
		};
	}
	function toBound(value) {
		return main_core.Type.isStringFilled(value) ? value : null;
	}
	function toMailboxes(raw) {
		return (raw ?? []).map(item => ({
			id: main_core.Text.toInteger(item?.id),
			email: String(item?.email ?? '')
		})).filter(item => item.id > 0);
	}
	const Api = {
		get(mailboxId) {
			return transport.runAction(ACTION_GET, {
				data: {
					mailboxId
				}
			}).then(response => ({
				setting: toSetting(response.data?.setting),
				mailboxes: toMailboxes(response.data?.mailboxes)
			}));
		},
		save(request) {
			return transport.runAction(ACTION_SAVE, {
				data: buildSavePayload(request)
			}).then(response => ({
				setting: toSetting(response.data?.setting)
			}));
		}
	};

	const ScreenStatus = Object.freeze({
		Loading: 'loading',
		Ready: 'ready',
		Failed: 'failed',
		Empty: 'empty'
	});
	const FormField = Object.freeze({
		Mailbox: 'mailbox',
		Period: 'period',
		Body: 'body'
	});
	const FINAL_LOAD_ERROR_CODES = new Set(['access_denied', 'feature_disabled', 'mailbox_not_found']);
	const FIELD_BY_ERROR_CODE = {
		body_required: FormField.Body,
		body_too_long: FormField.Body,
		period_required: FormField.Period,
		period_order: FormField.Period,
		mailbox_unavailable: FormField.Mailbox,
		mailbox_not_found: FormField.Mailbox,
		access_denied: FormField.Mailbox
	};
	function createEmptyFieldErrors() {
		return {
			mailbox: '',
			period: '',
			body: ''
		};
	}
	function createScreenStateData() {
		return ui_vue3.reactive({
			status: ScreenStatus.Loading,
			mailboxId: 0,
			setting: null,
			mailboxes: [],
			fieldErrors: createEmptyFieldErrors(),
			loadFailure: null,
			generation: 0,
			saving: false
		});
	}
	function normalizeMailboxes(mailboxes) {
		return mailboxes.filter(mailbox => mailbox.id > 0);
	}
	function readErrors(reason) {
		const errors = reason?.errors;
		return main_core.Type.isArray(errors) ? errors : [];
	}
	function parseSaveFailure(reason) {
		const fields = createEmptyFieldErrors();
		let common = '';
		for (const error of readErrors(reason)) {
			const [field, message] = describeError(error);
			if (field === null) {
				common = message;
			} else if (fields[field] === '') {
				fields[field] = message;
			}
		}
		if (common === '' && !hasFieldError(fields)) {
			common = fallbackMessage(reason);
		}
		return {
			fields,
			common
		};
	}
	function describeError(error) {
		const message = String(error?.message ?? '');
		const field = FIELD_BY_ERROR_CODE[String(error?.code ?? '')] ?? null;
		return [field, message === '' ? defaultCommonMessage() : message];
	}
	function fallbackMessage(reason) {
		if (reason instanceof Error && reason.message !== '') {
			return reason.message;
		}
		return defaultCommonMessage();
	}
	function hasFieldError(fields) {
		return Object.values(fields).some(message => message !== '');
	}
	function describeFailure(failure) {
		if (failure.common !== '') {
			return failure.common;
		}
		return main_core.Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVE_INVALID') ?? '';
	}
	function defaultCommonMessage() {
		return main_core.Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVE_FAILED') ?? '';
	}
	function parseLoadFailure(reason) {
		const errors = readErrors(reason);
		const refusal = errors.find(error => FINAL_LOAD_ERROR_CODES.has(String(error?.code ?? '')));
		if (refusal !== undefined) {
			return {
				message: loadErrorMessage(refusal),
				retryable: false
			};
		}
		const first = errors[0];
		return {
			message: first === undefined ? defaultLoadMessage() : loadErrorMessage(first),
			retryable: true
		};
	}
	function loadErrorMessage(error) {
		const message = String(error?.message ?? '');
		return message === '' ? defaultLoadMessage() : message;
	}
	function defaultLoadMessage() {
		return main_core.Loc.getMessage('MAIL_VACATION_AUTO_REPLY_LOAD_ERROR') ?? '';
	}
	function renderFieldErrors(targets, errors) {
		Object.values(FormField).forEach(field => {
			const target = targets[field];
			const message = errors[field];
			const invalid = message !== '';
			main_core.Dom.adjust(target.message, {
				text: message
			});
			target.controls.forEach(control => {
				if (invalid) {
					main_core.Dom.addClass(control, '--error');
				} else {
					main_core.Dom.removeClass(control, '--error');
				}
				main_core.Dom.attr(control, 'aria-invalid', invalid ? 'true' : 'false');
				main_core.Dom.attr(control, 'aria-describedby', describedBy(target, invalid));
			});
		});
	}
	function describedBy(target, invalid) {
		const ids = [target.hint?.id ?? '', invalid ? target.message.id : ''].filter(id => id !== '');
		return ids.length === 0 ? null : ids.join(' ');
	}
	function focusFirstInvalidField(targets, errors) {
		let focused = false;
		Object.values(FormField).forEach(field => {
			if (focused || errors[field] === '') {
				return;
			}
			focused = takeFocusTo(field, targets[field]);
		});
		return focused;
	}
	function takeFocusTo(field, target) {
		if (field === FormField.Mailbox) {
			return focusMessage(target.message);
		}
		if (target.focus !== undefined) {
			return target.focus();
		}
		const control = target.controls[0];
		if (control === undefined) {
			return false;
		}
		control.focus();
		return true;
	}
	function focusMessage(message) {
		main_core.Dom.attr(message, 'tabindex', '-1');
		message.focus();
		return document.activeElement === message;
	}
	function createSaveFailureHandler(state, resolveTargets, resolveGeneration) {
		return failure => {
			if (!state.applyFailure(resolveGeneration(), failure)) {
				return;
			}
			const targets = resolveTargets();
			const errors = state.getFieldErrors();
			renderFieldErrors(targets, errors);
			focusFirstInvalidField(targets, errors);
		};
	}
	function describeSaveBlock(state) {
		const status = state.getStatus();
		if (state.isSaving() || status === ScreenStatus.Loading) {
			return main_core.Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVE_WAIT') ?? '';
		}
		if (status === ScreenStatus.Failed) {
			return state.getLoadFailure()?.message ?? defaultLoadMessage();
		}
		if (status === ScreenStatus.Empty) {
			return main_core.Loc.getMessage('MAIL_VACATION_AUTO_REPLY_NO_MAILBOX') ?? '';
		}
		return state.canEdit() ? '' : main_core.Loc.getMessage('MAIL_VACATION_AUTO_REPLY_READONLY') ?? '';
	}
	class ScreenState {
		#data;
		#mailboxesFixed = false;
		constructor(data = createScreenStateData()) {
			this.#data = data;
			this.#mailboxesFixed = data.mailboxes.length > 0;
		}
		getData() {
			return this.#data;
		}
		getStatus() {
			return this.#data.status;
		}
		getSelectedMailboxId() {
			return this.#data.mailboxId;
		}
		getSetting() {
			return this.#data.setting;
		}
		getMailboxes() {
			return this.#data.mailboxes;
		}
		getFieldError(field) {
			return this.#data.fieldErrors[field];
		}
		getFieldErrors() {
			return {
				...this.#data.fieldErrors
			};
		}
		getLoadFailure() {
			return this.#data.loadFailure;
		}
		isSaving() {
			return this.#data.saving;
		}
		canEdit() {
			return this.#data.status === ScreenStatus.Ready && this.#data.setting?.canEdit === true;
		}
		beginLoading(mailboxId) {
			this.#data.generation += 1;
			this.#data.status = ScreenStatus.Loading;
			this.#data.mailboxId = mailboxId;
			this.#data.setting = null;
			this.#data.fieldErrors = createEmptyFieldErrors();
			this.#data.loadFailure = null;
			this.#data.saving = false;
			return this.#data.generation;
		}
		applyLoaded(generation, response) {
			if (generation !== this.#data.generation) {
				return false;
			}
			this.#data.status = ScreenStatus.Ready;
			this.#data.setting = response.setting;
			if (!this.#mailboxesFixed) {
				this.#data.mailboxes = normalizeMailboxes(response.mailboxes);
				this.#mailboxesFixed = true;
			}
			this.#data.mailboxId = response.setting.mailboxId;
			this.#data.loadFailure = null;
			return true;
		}
		failLoading(generation, failure) {
			if (generation !== this.#data.generation) {
				return false;
			}
			this.#data.status = ScreenStatus.Failed;
			this.#data.setting = null;
			this.#data.loadFailure = failure;
			return true;
		}
		markEmpty() {
			this.#data.status = ScreenStatus.Empty;
			this.#data.setting = null;
			this.#data.mailboxId = 0;
		}
		beginSaving() {
			this.#data.saving = true;
			return this.#data.generation;
		}
		applySaved(generation, setting) {
			if (generation !== this.#data.generation) {
				return false;
			}
			this.#data.saving = false;
			this.#data.setting = setting;
			this.#data.mailboxId = setting.mailboxId;
			this.#data.fieldErrors = createEmptyFieldErrors();
			return true;
		}
		applyFailure(generation, failure) {
			if (generation !== this.#data.generation) {
				return false;
			}
			this.#data.saving = false;
			this.#data.fieldErrors = failure.fields;
			return true;
		}
		stopWaiting() {
			this.#data.generation += 1;
			this.#data.saving = false;
		}
		clearFieldErrors() {
			this.#data.fieldErrors = createEmptyFieldErrors();
		}
		refreshMailboxSelection() {
			this.#data.mailboxes = [...this.#data.mailboxes];
		}
	}

	const MailboxInputId = 'mail-vacation-auto-reply-mailbox-input';
	const MailboxMenuId = 'mail-vacation-auto-reply-mailbox-menu';
	const MailboxOptionTestIdPrefix = 'mail-vacation-auto-reply-mailbox-option';
	class MailboxSelectAdapter {
		#container;
		#select = null;
		#onSelect;
		#isApplyingValue = false;
		#optionIds = [];
		#menuObserver = null;
		#menuContainer = null;
		#suppressInputOpen = false;
		#restoreInputFocusAfterClose = true;
		#suppressInputOpenTimer = null;
		#inputOpenTimer = null;
		constructor(options) {
			this.#container = options.container;
			this.#onSelect = options.onSelect;
			const selectOptions = this.#buildOptions(options.mailboxes);
			this.#optionIds = selectOptions.map(option => option.value);
			this.#select = new ui_select.Select({
				options: selectOptions,
				value: String(options.selectedId),
				placeholder: options.placeholder,
				popupParams: {
					id: MailboxMenuId,
					focusTrap: true,
					events: {
						onShow: () => {
							this.#handleMenuShow();
						},
						onClose: () => {
							this.#handleMenuClose();
						},
						onAfterClose: () => {
							this.#handleMenuAfterClose();
						},
						onDestroy: () => {
							this.#disconnectMenuObserver();
						}
					}
				}
			});
			this.#select.renderTo(this.#container);
			const input = this.#select.getInput();
			main_core.Dom.attr(input, {
				id: MailboxInputId,
				role: 'combobox',
				'aria-haspopup': 'menu',
				'aria-expanded': 'false',
				autocomplete: 'off'
			});
			if (input !== null) {
				main_core.Event.bind(input, 'blur', this.#handleInputBlur, true);
				main_core.Event.bind(input, 'focus', this.#handleInputFocus, true);
				main_core.Event.bind(input, 'mouseup', this.#handleInputMouseUp, true);
				main_core.Event.bind(input, 'keydown', this.#handleInputKeyDown, true);
			}
			this.#select.subscribe('update', event => {
				this.#handleSelect(event);
			});
		}
		setSelectedId(mailboxId) {
			if (this.#select === null || this.#select.getValue() === String(mailboxId)) {
				return;
			}
			this.#isApplyingValue = true;
			this.#select.setValue(String(mailboxId));
			this.#isApplyingValue = false;
		}
		destroy() {
			const input = this.#select?.getInput();
			if (input !== null && input !== undefined) {
				main_core.Event.unbind(input, 'blur', this.#handleInputBlur, true);
				main_core.Event.unbind(input, 'focus', this.#handleInputFocus, true);
				main_core.Event.unbind(input, 'mouseup', this.#handleInputMouseUp, true);
				main_core.Event.unbind(input, 'keydown', this.#handleInputKeyDown, true);
			}
			this.#clearInputOpenTimer();
			this.#clearSuppressInputOpenTimer();
			this.#disconnectMenuObserver();
			this.#select = null;
			main_popup.PopupManager.getPopupById(MailboxMenuId)?.destroy();
			main_core.Dom.clean(this.#container);
		}
		#handleMenuShow() {
			const popup = main_popup.PopupManager.getPopupById(MailboxMenuId);
			const menuContainer = popup?.getContentContainer();
			const popupContainer = popup?.getPopupContainer();
			const input = this.#select?.getInput();
			if (!menuContainer || !popupContainer || input === null || input === undefined) {
				return;
			}
			main_core.Dom.attr(input, {
				'aria-controls': popupContainer.id,
				'aria-expanded': 'true'
			});
			this.#restoreInputFocusAfterClose = true;
			this.#disconnectMenuObserver();
			this.#menuContainer = menuContainer;
			main_core.Event.bind(menuContainer, 'click', this.#handleMenuClick);
			this.#menuObserver = new MutationObserver(() => {
				this.#applyOptionTestIds(menuContainer);
			});
			this.#menuObserver.observe(menuContainer, {
				childList: true,
				subtree: true
			});
			this.#applyOptionTestIds(menuContainer);
		}
		#handleMenuClose() {
			this.#clearInputOpenTimer();
			this.#disconnectMenuObserver();
			const input = this.#select?.getInput();
			if (input === null || input === undefined) {
				return;
			}
			main_core.Dom.attr(input, 'aria-expanded', 'false');
			this.#suppressOpeningOnFocus();
		}
		#handleMenuAfterClose() {
			const input = this.#select?.getInput();
			if (input === null || input === undefined) {
				return;
			}
			main_core.Dom.attr(input, 'aria-expanded', 'false');
			this.#suppressOpeningOnFocus();
			if (!this.#restoreInputFocusAfterClose) {
				return;
			}
			input.focus({
				preventScroll: true
			});
		}
		#suppressOpeningOnFocus() {
			this.#suppressInputOpen = true;
			this.#clearSuppressInputOpenTimer();
			this.#suppressInputOpenTimer = window.setTimeout(() => {
				this.#suppressInputOpen = false;
				this.#suppressInputOpenTimer = null;
			}, 150);
		}
		#handleInputBlur = event => {
			const popupContainer = main_popup.PopupManager.getPopupById(MailboxMenuId)?.getPopupContainer();
			if (popupContainer?.contains(event.relatedTarget)) {
				event.stopImmediatePropagation();
				return;
			}
			this.#restoreInputFocusAfterClose = false;
			this.#clearInputOpenTimer();
		};
		#handleInputFocus = event => {
			event.stopImmediatePropagation();
			if (this.#suppressInputOpen) {
				return;
			}
			this.#scheduleInputOpen();
		};
		#handleInputMouseUp = event => {
			event.stopImmediatePropagation();
			if (event.currentTarget === document.activeElement) {
				this.#scheduleInputOpen();
			}
		};
		#handleInputKeyDown = event => {
			if (this.#select === null || this.#select.isMenuShown() || event.key !== 'Enter' && event.key !== 'ArrowDown') {
				return;
			}
			this.#clearInputOpenTimer();
			event.preventDefault();
			event.stopImmediatePropagation();
			this.#select.showMenu();
		};
		#handleMenuClick = event => {
			const target = event.target;
			if (target instanceof Element && target.closest('[role="menuitem"]') !== null) {
				this.#select?.hideMenu();
			}
		};
		#scheduleInputOpen() {
			this.#clearInputOpenTimer();
			this.#inputOpenTimer = window.setTimeout(() => {
				this.#inputOpenTimer = null;
				this.#select?.showMenu();
			}, 100);
		}
		#applyOptionTestIds(menuContainer) {
			menuContainer.querySelectorAll('[role="menuitem"]').forEach((optionElement, index) => {
				const optionId = this.#optionIds[index];
				if (optionId) {
					main_core.Dom.attr(optionElement, 'data-testid', `${MailboxOptionTestIdPrefix}-${optionId}`);
				}
			});
		}
		#disconnectMenuObserver() {
			this.#menuObserver?.disconnect();
			this.#menuObserver = null;
			if (this.#menuContainer !== null) {
				main_core.Event.unbind(this.#menuContainer, 'click', this.#handleMenuClick);
				this.#menuContainer = null;
			}
		}
		#clearSuppressInputOpenTimer() {
			if (this.#suppressInputOpenTimer !== null) {
				window.clearTimeout(this.#suppressInputOpenTimer);
				this.#suppressInputOpenTimer = null;
			}
		}
		#clearInputOpenTimer() {
			if (this.#inputOpenTimer !== null) {
				window.clearTimeout(this.#inputOpenTimer);
				this.#inputOpenTimer = null;
			}
		}
		#handleSelect(event) {
			if (this.#isApplyingValue) {
				return;
			}
			this.#onSelect(main_core.Text.toInteger(event.getData()));
		}
		#buildOptions(mailboxes) {
			return mailboxes.filter(mailbox => mailbox.id > 0).map(mailbox => ({
				label: mailbox.email,
				value: String(mailbox.id)
			}));
		}
	}

	const EXISTING_SETTING_ID = 1;
	const LOCKED_CLASS$1 = '--locked';
	const DEFAULT_SLIDER_MESSAGE = {
		eventId: 'mail-vacation-auto-reply',
		idKey: 'mailboxId'
	};
	const TOOLBAR_CONTROL_SELECTOR = '.bxhtmled-top-bar-btn, .bxhtmled-top-bar-select';
	const TOOLBAR_MENU_CONTROL_SELECTOR = '.bxhtmled-top-bar-select';
	const TOOLBAR_DISABLED_CLASS = 'bxhtmled-button-disabled';
	const TOOLBAR_CONTROL_LABEL_MESSAGES = new Map([['.bxhtmled-button-fontsize', 'FontSizeTitle']]);
	class EditorAdapter {
		#editorInstanceId;
		#editorNode;
		#alertContainer;
		#editor = null;
		#initialLocation;
		#initialAttributes;
		#controlAttributes = new Map();
		#toolbar = null;
		#toolbarAttributes = null;
		#toolbarControlAttributes = new Map();
		#toolbarFocusZone = null;
		#toolbarObserver = null;
		#disabled = false;
		#destroyed = false;
		constructor(options) {
			this.#editorInstanceId = options.editorInstanceId;
			this.#editorNode = options.editorNode;
			this.#alertContainer = options.alertContainer;
			this.#initialLocation = this.#captureLocation(this.#editorNode);
			this.#initialAttributes = {
				ariaDisabled: this.#editorNode.getAttribute('aria-disabled'),
				locked: main_core.Dom.hasClass(this.#editorNode, LOCKED_CLASS$1)
			};
			main_core.Dom.append(this.#editorNode, options.host);
			this.#editor = new mail_signature_editor.SignatureEditor({
				editorInstanceId: this.#editorInstanceId,
				signatureId: options.signatureId ?? EXISTING_SETTING_ID,
				alertContainer: this.#alertContainer,
				transport: options.transport,
				sliderMessage: options.sliderMessage ?? DEFAULT_SLIDER_MESSAGE
			});
			this.#setupToolbarAccessibility(options.toolbarLabel);
		}
		setBody(body) {
			const editor = this.#getEditor();
			if (editor === null || this.#destroyed) {
				return false;
			}
			editor.SetContent(String(body ?? ''), true);
			this.#applyEditorLock();
			return true;
		}
		getBody() {
			return this.#requireEditor().GetContent();
		}
		save() {
			this.#editor?.save();
		}
		showError(text) {
			this.#editor?.showError(text);
		}
		clearError() {
			this.#editor?.clearError();
		}
		focus() {
			const editor = this.#getEditor();
			if (editor === null || this.#destroyed) {
				return false;
			}
			if (editor.GetViewMode?.() !== 'code') {
				this.#editorNode.querySelector('iframe')?.contentWindow?.focus();
			}
			editor.Focus();
			return true;
		}
		getControls() {
			return this.#getEditorControls();
		}
		setDisabled(disabled) {
			if (this.#destroyed) {
				return;
			}
			this.#disabled = disabled;
			this.#applyEditorLock();
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#destroyToolbarAccessibility();
			this.#editor?.destroy();
			this.#editor = null;
			main_core.Dom.clean(this.#alertContainer);
			this.#restoreEditorLock();
			this.#restoreLocation();
		}
		#captureLocation(node) {
			if (node.parentNode === null) {
				return null;
			}
			return {
				parent: node.parentNode,
				nextSibling: node.nextSibling
			};
		}
		#applyEditorLock() {
			main_core.Dom.attr(this.#editorNode, 'aria-disabled', this.#disabled ? 'true' : this.#initialAttributes.ariaDisabled);
			if (this.#disabled || this.#initialAttributes.locked) {
				main_core.Dom.addClass(this.#editorNode, LOCKED_CLASS$1);
			} else {
				main_core.Dom.removeClass(this.#editorNode, LOCKED_CLASS$1);
			}
			this.#getEditorControls().forEach(control => {
				this.#applyControlLock(control);
			});
			this.#applyToolbarLock();
			this.#syncToolbarControls();
		}
		#restoreEditorLock() {
			this.#disabled = false;
			main_core.Dom.attr(this.#editorNode, 'aria-disabled', this.#initialAttributes.ariaDisabled);
			if (this.#initialAttributes.locked) {
				main_core.Dom.addClass(this.#editorNode, LOCKED_CLASS$1);
			} else {
				main_core.Dom.removeClass(this.#editorNode, LOCKED_CLASS$1);
			}
			this.#getEditorControls().forEach(control => {
				this.#restoreControlLock(control);
			});
			this.#applyToolbarLock();
			this.#syncToolbarControls();
			this.#controlAttributes.clear();
		}
		#setupToolbarAccessibility(label) {
			const toolbar = this.#editorNode.querySelector('.bxhtmled-toolbar');
			if (toolbar === null) {
				return;
			}
			this.#toolbar = toolbar;
			this.#toolbarAttributes = {
				role: toolbar.getAttribute('role'),
				ariaLabel: toolbar.getAttribute('aria-label')
			};
			main_core.Dom.attr(toolbar, {
				role: 'toolbar',
				'aria-label': label
			});
			this.#syncToolbarControls();
			this.#toolbarFocusZone = new ui_a11y.FocusZone(toolbar, {
				bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd,
				focusInStrategy: 'previous',
				focusOutBehavior: 'wrap',
				focusableElementFilter: element => {
					return element.matches(TOOLBAR_CONTROL_SELECTOR) && element.getAttribute('aria-disabled') !== 'true';
				}
			});
			this.#toolbarFocusZone.activate();
			this.#toolbarObserver = new MutationObserver(() => {
				this.#syncToolbarControls();
				this.#toolbarFocusZone?.refreshElements();
			});
			this.#toolbarObserver.observe(toolbar, {
				attributes: true,
				attributeFilter: ['class', 'hidden', 'style', 'title'],
				childList: true,
				subtree: true
			});
		}
		#syncToolbarControls() {
			if (this.#toolbar === null) {
				return;
			}
			this.#toolbarControlAttributes.forEach((attributes, control) => {
				if (!this.#toolbar?.contains(control)) {
					main_core.Event.unbind(control, 'keydown', this.#handleToolbarControlKeyDown);
					this.#toolbarControlAttributes.delete(control);
				}
			});
			this.#toolbar.querySelectorAll(TOOLBAR_CONTROL_SELECTOR).forEach(control => {
				if (!this.#toolbarControlAttributes.has(control)) {
					this.#toolbarControlAttributes.set(control, {
						role: control.getAttribute('role'),
						tabIndex: control.getAttribute('tabindex'),
						ariaLabel: control.getAttribute('aria-label'),
						ariaDisabled: control.getAttribute('aria-disabled'),
						ariaHasPopup: control.getAttribute('aria-haspopup')
					});
					main_core.Event.bind(control, 'keydown', this.#handleToolbarControlKeyDown);
				}
				const label = this.#resolveToolbarControlLabel(control);
				const disabled = main_core.Dom.hasClass(control, TOOLBAR_DISABLED_CLASS);
				main_core.Dom.attr(control, {
					role: 'button',
					tabindex: disabled ? '-1' : '0',
					'aria-label': label,
					'aria-disabled': disabled ? 'true' : null,
					'aria-haspopup': control.matches(TOOLBAR_MENU_CONTROL_SELECTOR) ? 'menu' : null
				});
			});
		}
		#resolveToolbarControlLabel(control) {
			const title = control.getAttribute('title')?.trim() ?? '';
			const text = control.textContent?.trim() ?? '';
			if (title !== '' || text !== '') {
				return title || text;
			}
			for (const [selector, messageCode] of TOOLBAR_CONTROL_LABEL_MESSAGES) {
				if (control.matches(selector)) {
					return main_core.Loc.getMessage(messageCode) ?? '';
				}
			}
			return '';
		}
		#destroyToolbarAccessibility() {
			this.#toolbarObserver?.disconnect();
			this.#toolbarObserver = null;
			this.#toolbarFocusZone?.deactivate();
			this.#toolbarFocusZone = null;
			this.#toolbarControlAttributes.forEach((attributes, control) => {
				main_core.Event.unbind(control, 'keydown', this.#handleToolbarControlKeyDown);
				main_core.Dom.attr(control, {
					role: attributes.role,
					tabindex: attributes.tabIndex,
					'aria-label': attributes.ariaLabel,
					'aria-disabled': attributes.ariaDisabled,
					'aria-haspopup': attributes.ariaHasPopup
				});
			});
			this.#toolbarControlAttributes.clear();
			if (this.#toolbar !== null && this.#toolbarAttributes !== null) {
				main_core.Dom.attr(this.#toolbar, {
					role: this.#toolbarAttributes.role,
					'aria-label': this.#toolbarAttributes.ariaLabel
				});
			}
			this.#toolbar = null;
			this.#toolbarAttributes = null;
		}
		#handleToolbarControlKeyDown = event => {
			if (event.key !== 'Enter' && event.key !== ' ') {
				return;
			}
			const control = event.currentTarget;
			if (control === null || control.getAttribute('aria-disabled') === 'true') {
				return;
			}
			event.preventDefault();
			control.click();
		};
		#applyControlLock(control) {
			if (!this.#controlAttributes.has(control)) {
				this.#controlAttributes.set(control, {
					tabIndex: control.getAttribute('tabindex'),
					readonly: control.getAttribute('readonly')
				});
			}
			if (this.#disabled) {
				main_core.Dom.attr(control, 'tabindex', '-1');
				this.#setTextareaReadonly(control, 'readonly');
				return;
			}
			this.#restoreControlLock(control);
		}
		#restoreControlLock(control) {
			const attributes = this.#controlAttributes.get(control);
			if (attributes === undefined) {
				return;
			}
			main_core.Dom.attr(control, 'tabindex', attributes.tabIndex);
			this.#setTextareaReadonly(control, attributes.readonly);
		}
		#setTextareaReadonly(control, value) {
			if (control.tagName !== 'TEXTAREA') {
				return;
			}
			main_core.Dom.attr(control, 'readonly', value);
		}
		#applyToolbarLock() {
			const editor = this.#getEditor();
			if (editor === null || editor.toolbar === undefined || !main_core.Type.isFunction(editor.toolbar.DisableWysiwygButtons)) {
				return;
			}
			const disabledByMode = editor.GetViewMode?.() === 'code';
			editor.toolbar.DisableWysiwygButtons(this.#disabled || disabledByMode);
		}
		#getEditorControls() {
			return [...this.#editorNode.querySelectorAll('iframe, textarea')];
		}
		#restoreLocation() {
			if (this.#initialLocation === null) {
				return;
			}
			const {
				parent,
				nextSibling
			} = this.#initialLocation;
			if (nextSibling !== null && nextSibling.parentNode === parent) {
				main_core.Dom.insertBefore(this.#editorNode, nextSibling);
				return;
			}
			main_core.Dom.append(this.#editorNode, parent);
		}
		#getEditor() {
			const manager = main_core.Reflection.getClass('BXHtmlEditor');
			const editor = manager?.Get(this.#editorInstanceId) ?? null;
			return editor === false ? null : editor;
		}
		#requireEditor() {
			const editor = this.#getEditor();
			if (editor === null) {
				throw new Error(`HTML editor ${this.#editorInstanceId} is not initialized`);
			}
			return editor;
		}
	}

	const TestId$4 = Object.freeze({
		alert: 'mail-vacation-auto-reply-alert',
		error: 'mail-vacation-auto-reply-error-body',
		host: 'mail-vacation-auto-reply-editor-host'
	});
	const FocusClass = '--focused';
	function loc$4(phrase) {
		return main_core.Loc.getMessage(phrase) ?? '';
	}
	function resolveElement$1(element) {
		return main_core.Type.isElementNode(element) ? element : null;
	}
	function resolveIframeBody(control) {
		if (!(control instanceof HTMLIFrameElement)) {
			return null;
		}
		try {
			const body = control.contentDocument?.body;
			return body === undefined || body === null ? null : resolveElement$1(body);
		} catch {
			return null;
		}
	}
	function createFocusBinding(control, host) {
		const showFocus = () => main_core.Dom.addClass(host, FocusClass);
		const hideFocus = () => main_core.Dom.removeClass(host, FocusClass);
		const iframeBody = resolveIframeBody(control);
		main_core.Event.bind(control, 'focusin', showFocus);
		main_core.Event.bind(control, 'focusout', hideFocus);
		if (iframeBody !== null) {
			main_core.Event.bind(iframeBody, 'focusin', showFocus);
			main_core.Event.bind(iframeBody, 'focusout', hideFocus);
		}
		return {
			control,
			iframeBody,
			host,
			showFocus,
			hideFocus
		};
	}
	function destroyFocusBinding(binding) {
		main_core.Event.unbind(binding.control, 'focusin', binding.showFocus);
		main_core.Event.unbind(binding.control, 'focusout', binding.hideFocus);
		if (binding.iframeBody !== null) {
			main_core.Event.unbind(binding.iframeBody, 'focusin', binding.showFocus);
			main_core.Event.unbind(binding.iframeBody, 'focusout', binding.hideFocus);
		}
		main_core.Dom.removeClass(binding.host, FocusClass);
	}
	const EditorHost = ui_vue3.defineComponent({
		name: 'MailVacationAutoReplyEditorHost',
		props: {
			editorId: {
				type: String,
				default: ''
			},
			editorNode: {
				type: Object,
				default: null
			},
			transport: {
				type: Object,
				default: null
			},
			body: {
				type: String,
				default: ''
			},
			setting: {
				type: Object,
				default: undefined
			},
			readonly: {
				type: Boolean,
				default: false
			},
			error: {
				type: String,
				default: ''
			}
		},
		setup() {
			let adapter = null;
			let focusBindings = [];
			const clearFocusBindings = () => {
				focusBindings.forEach(binding => destroyFocusBinding(binding));
				focusBindings = [];
			};
			return {
				testId: TestId$4,
				createAdapter(options) {
					clearFocusBindings();
					adapter?.destroy();
					adapter = ui_vue3.markRaw(new EditorAdapter(options));
				},
				destroyAdapter() {
					clearFocusBindings();
					adapter?.destroy();
					adapter = null;
				},
				hasAdapter() {
					return adapter !== null;
				},
				setAdapterBody(body) {
					return adapter?.setBody(body) === true;
				},
				getAdapterBody() {
					return adapter?.getBody() ?? '';
				},
				saveAdapter() {
					if (adapter === null) {
						return false;
					}
					adapter.save();
					return true;
				},
				showAdapterError(text) {
					if (adapter === null) {
						return false;
					}
					adapter.showError(text);
					return true;
				},
				clearAdapterError() {
					if (adapter === null) {
						return false;
					}
					adapter.clearError();
					return true;
				},
				focusAdapter() {
					return adapter?.focus() === true;
				},
				getAdapterControls() {
					return adapter?.getControls() ?? [];
				},
				setAdapterDisabled(disabled) {
					adapter?.setDisabled(disabled);
				},
				bindControlFocus(control, host) {
					const alreadyBound = focusBindings.some(binding => {
						return binding.control === control && binding.host === host;
					});
					if (alreadyBound) {
						return;
					}
					focusBindings.push(createFocusBinding(control, host));
				}
			};
		},
		computed: {
			bodyLabel() {
				return loc$4('MAIL_VACATION_AUTO_REPLY_BODY_LABEL');
			}
		},
		watch: {
			body(value) {
				if (this.setting === undefined) {
					this.setBody(value);
				}
			},
			setting(value) {
				if (value !== null && value !== undefined) {
					this.setBody(value.body);
				}
			},
			readonly(value) {
				this.setReadonly(value);
			}
		},
		mounted() {
			this.mountEditor();
		},
		beforeUnmount() {
			this.destroyAdapter();
		},
		methods: {
			mountEditor() {
				const refs = this.$refs;
				const host = resolveElement$1(refs.host);
				const alert = resolveElement$1(refs.alert);
				if (this.editorId === '' || this.editorNode === null || this.transport === null || host === null || alert === null) {
					return;
				}
				this.createAdapter({
					editorInstanceId: this.editorId,
					editorNode: this.editorNode,
					host,
					alertContainer: alert,
					toolbarLabel: this.bodyLabel,
					transport: this.transport
				});
				this.setBody(this.setting === undefined ? this.body : this.setting?.body ?? '');
				this.setReadonly(this.readonly);
			},
			setBody(body) {
				const applied = this.setAdapterBody(body);
				this.nameControls();
				return applied;
			},
			getBody() {
				return this.getAdapterBody();
			},
			save() {
				if (this.saveAdapter()) {
					return true;
				}
				this.showError(loc$4('MAIL_VACATION_AUTO_REPLY_LOAD_ERROR'));
				return false;
			},
			showError(text) {
				if (this.showAdapterError(text)) {
					return;
				}
				const refs = this.$refs;
				const alert = resolveElement$1(refs.alert);
				if (alert !== null) {
					main_core.Dom.adjust(alert, {
						text
					});
				}
			},
			clearError() {
				if (this.clearAdapterError()) {
					return;
				}
				const refs = this.$refs;
				const alert = resolveElement$1(refs.alert);
				if (alert !== null) {
					main_core.Dom.clean(alert);
				}
			},
			focus() {
				return this.focusAdapter();
			},
			getControls() {
				if (this.hasAdapter()) {
					return this.getAdapterControls();
				}
				return this.editorNode === null ? [] : [...this.editorNode.querySelectorAll('iframe, textarea')];
			},
			setReadonly(readonly) {
				this.setAdapterDisabled(readonly);
			},
			nameControls() {
				if (this.bodyLabel === '') {
					return;
				}
				const refs = this.$refs;
				const host = resolveElement$1(refs.host);
				this.getControls().forEach(control => {
					main_core.Dom.attr(control, 'title', this.bodyLabel);
					if (host !== null) {
						this.bindControlFocus(control, host);
					}
				});
			},
			getErrorTarget() {
				const refs = this.$refs;
				const message = resolveElement$1(refs.error);
				return {
					message: message ?? document.createElement('div'),
					controls: this.getControls(),
					focus: () => this.focus()
				};
			}
		},
		template: `
		<div class="mail-vacation-auto-reply-form__editor-host">
			<div
				ref="alert"
				class="mail-vacation-auto-reply-form__alert"
				:data-testid="testId.alert"
				role="alert"
			></div>
			<div class="mail-vacation-auto-reply-form__row">
				<span class="mail-vacation-auto-reply-form__label">
					{{ bodyLabel }}
				</span>
				<div
					ref="error"
					:id="testId.error"
					class="mail-vacation-auto-reply-form__error"
					data-role="error-body"
					:data-testid="testId.error"
				>{{ error }}</div>
			</div>
			<div
				ref="host"
				class="mail-vacation-auto-reply-form__editor-slot"
				:data-testid="testId.host"
			></div>
		</div>
	`
	});

	const TestId$3 = Object.freeze({
		field: 'mail-vacation-auto-reply-mailbox',
		error: 'mail-vacation-auto-reply-error-mailbox'
	});
	function loc$3(phrase) {
		return main_core.Loc.getMessage(phrase) ?? '';
	}
	const MailboxField = ui_vue3.defineComponent({
		name: 'MailVacationAutoReplyMailboxField',
		props: {
			modelValue: {
				type: Number,
				required: true
			},
			mailboxes: {
				type: Array,
				required: true
			},
			error: {
				type: String,
				default: ''
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				inputId: MailboxInputId,
				testId: TestId$3
			};
		},
		data() {
			return {
				adapter: null
			};
		},
		computed: {
			label() {
				return loc$3('MAIL_VACATION_AUTO_REPLY_MAILBOX_LABEL');
			},
			placeholder() {
				return loc$3('MAIL_VACATION_AUTO_REPLY_MAILBOX_PLACEHOLDER');
			},
			normalizedMailboxes() {
				return this.mailboxes.filter(mailbox => mailbox.id > 0);
			}
		},
		watch: {
			modelValue() {
				this.syncAdapter();
			},
			mailboxes() {
				this.syncAdapter();
			}
		},
		mounted() {
			this.syncAdapter();
		},
		beforeUnmount() {
			this.destroyAdapter();
		},
		methods: {
			syncAdapter() {
				const container = this.$refs.field;
				if (!main_core.Type.isElementNode(container)) {
					return;
				}
				if (this.normalizedMailboxes.length === 0) {
					this.destroyAdapter();
					return;
				}
				if (this.adapter === null) {
					this.createAdapter(container);
					return;
				}
				this.adapter.setSelectedId(this.modelValue);
			},
			createAdapter(container) {
				const options = {
					container,
					mailboxes: this.normalizedMailboxes,
					selectedId: this.modelValue,
					placeholder: this.placeholder,
					onSelect: mailboxId => {
						this.$emit('update:modelValue', mailboxId);
					}
				};
				this.adapter = ui_vue3.markRaw(new MailboxSelectAdapter(options));
			},
			destroyAdapter() {
				this.adapter?.destroy();
				this.adapter = null;
			}
		},
		template: `
		<div class="mail-vacation-auto-reply-form__row">
			<label class="mail-vacation-auto-reply-form__label" :for="inputId">
				{{ label }}
			</label>
			<div
				ref="field"
				class="mail-vacation-auto-reply-form__control"
				:data-testid="testId.field"
			></div>
			<div
				:id="testId.error"
				class="mail-vacation-auto-reply-form__error"
				data-role="error-mailbox"
				:data-testid="testId.error"
			>{{ error }}</div>
		</div>
	`
	});

	const BOUND_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;
	function pad(value, length = 2) {
		return String(value).padStart(length, '0');
	}
	function readBound(value) {
		const parts = BOUND_PATTERN.exec(String(value ?? ''));
		if (parts === null) {
			return null;
		}
		return `${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:${parts[6] ?? '00'}`;
	}
	function toCalendarDate(bound) {
		const parts = BOUND_PATTERN.exec(String(bound ?? ''));
		if (parts === null) {
			return null;
		}
		return ui_datePicker.createUtcDate(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6] ?? '0'));
	}
	function fromCalendarDate(date) {
		if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
			return null;
		}
		const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
		const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
		return `${day}T${time}`;
	}
	function toRequestBound(bound) {
		return bound ?? '';
	}
	function toMinutes(bound) {
		return bound.slice(0, 'YYYY-MM-DDTHH:MM'.length);
	}
	function keepSeconds(loaded, shown) {
		if (loaded === null || shown === null) {
			return shown;
		}
		return toMinutes(loaded) === toMinutes(shown) ? loaded : shown;
	}
	function applyBound(picker, input, bound) {
		picker?.deselectAll();
		const date = toCalendarDate(bound);
		if (date === null) {
			main_core.Dom.adjust(input, {
				props: {
					value: ''
				}
			});
			return;
		}
		picker?.selectDate(date);
	}
	const EXAMPLE_HOUR = 9;
	function describeBoundExample(picker) {
		if (picker === null) {
			return '';
		}
		const today = new Date();
		return picker.formatDate(ui_datePicker.createUtcDate(today.getFullYear(), today.getMonth(), today.getDate(), EXAMPLE_HOUR, 0, 0));
	}
	const OFFSET_NAME_PATTERN = /^(?:GMT|UTC)/;
	function resolveTimezoneId(settingTimezoneId, fallback) {
		const timezoneId = String(settingTimezoneId ?? '');
		return timezoneId === '' ? String(fallback ?? '') : timezoneId;
	}
	function describeTimezone(timezoneId, languageId) {
		if (timezoneId === '') {
			return '';
		}
		const offset = toUtcOffset(readTimezonePart(timezoneId, languageId, 'longOffset'));
		const name = readTimezonePart(timezoneId, languageId, 'shortGeneric');
		if (name === '' || name === timezoneId || OFFSET_NAME_PATTERN.test(name)) {
			return offset === '' ? timezoneId : offset;
		}
		return offset === '' ? name : `${name} (${offset})`;
	}
	function toUtcOffset(offset) {
		return offset.replace('GMT', 'UTC');
	}
	function readTimezonePart(timezoneId, languageId, timeZoneName) {
		try {
			const parts = new Intl.DateTimeFormat(languageId === '' ? undefined : languageId, {
				timeZone: timezoneId,
				timeZoneName
			}).formatToParts(new Date());
			return parts.find(part => part.type === 'timeZoneName')?.value ?? '';
		} catch {
			return '';
		}
	}

	const LOCKED_CLASS = '--locked';
	class DatePickerAdapter {
		#input;
		#picker = null;
		#onChange;
		#initialAttributes;
		#isApplyingValue = false;
		#disabled = false;
		#destroyed = false;
		#focusTimer = null;
		constructor(options) {
			this.#input = options.input;
			this.#onChange = options.onChange ?? null;
			this.#initialAttributes = {
				readonly: this.#input.getAttribute('readonly'),
				ariaDisabled: this.#input.getAttribute('aria-disabled'),
				locked: main_core.Dom.hasClass(this.#input, LOCKED_CLASS)
			};
			this.#picker = new ui_datePicker.DatePicker({
				targetNode: this.#input,
				inputField: this.#input,
				selectionMode: 'single',
				enableTime: true,
				cutZeroTime: false,
				events: {
					[ui_datePicker.DatePickerEvent.SELECT_CHANGE]: () => this.#handleChange(),
					onShow: () => this.#handleShow(),
					onHide: () => this.#handleHide()
				}
			});
			main_core.Event.bind(this.#input, 'input', this.#handleInput);
		}
		setValue(bound) {
			if (this.#picker === null || this.#destroyed) {
				return;
			}
			this.#isApplyingValue = true;
			try {
				applyBound(this.#picker, this.#input, readBound(bound));
			} finally {
				this.#isApplyingValue = false;
			}
		}
		getBound(loadedBound = null) {
			return keepSeconds(readBound(loadedBound), this.#readInputBound());
		}
		getRequestValue(loadedBound = null) {
			return toRequestBound(this.getBound(loadedBound));
		}
		getFormatExample() {
			return describeBoundExample(this.#picker);
		}
		focus() {
			this.#input.focus();
		}
		setDisabled(disabled) {
			if (this.#destroyed) {
				return;
			}
			this.#disabled = disabled;
			if (disabled) {
				this.#picker?.hide();
				main_core.Dom.attr(this.#input, {
					readonly: 'readonly',
					'aria-disabled': 'true'
				});
				main_core.Dom.addClass(this.#input, LOCKED_CLASS);
				return;
			}
			this.#restoreAttributes();
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#clearFocusTimer();
			main_core.Event.unbind(this.#input, 'input', this.#handleInput);
			this.#picker?.hide();
			this.#picker?.destroy();
			this.#picker = null;
			main_core.Dom.attr(this.#input, 'aria-controls', null);
			this.#restoreAttributes();
		}
		#handleInput = () => {
			this.#handleChange();
		};
		#handleShow() {
			if (this.#picker === null || this.#destroyed) {
				return;
			}
			const popupContainer = this.#picker.getPopup().getPopupContainer();
			if (popupContainer.id !== '') {
				main_core.Dom.attr(this.#input, 'aria-controls', popupContainer.id);
			}
			this.#clearFocusTimer();
			this.#focusTimer = window.setTimeout(() => {
				this.#focusTimer = null;
				if (this.#picker?.isOpen() === true) {
					this.#picker.focus();
				}
			}, 0);
		}
		#handleHide() {
			this.#clearFocusTimer();
			main_core.Dom.attr(this.#input, 'aria-controls', null);
		}
		#clearFocusTimer() {
			if (this.#focusTimer !== null) {
				window.clearTimeout(this.#focusTimer);
				this.#focusTimer = null;
			}
		}
		#handleChange() {
			if (this.#isApplyingValue || this.#disabled || this.#destroyed) {
				return;
			}
			this.#onChange?.(this.#readInputBound());
		}
		#readInputBound() {
			if (this.#picker === null) {
				return null;
			}
			const value = this.#input.value.trim();
			if (value === '') {
				return null;
			}
			return fromCalendarDate(ui_datePicker.createDate(value, this.#picker.getDateFormat()));
		}
		#restoreAttributes() {
			main_core.Dom.attr(this.#input, {
				readonly: this.#initialAttributes.readonly,
				'aria-disabled': this.#initialAttributes.ariaDisabled
			});
			if (this.#initialAttributes.locked) {
				main_core.Dom.addClass(this.#input, LOCKED_CLASS);
			} else {
				main_core.Dom.removeClass(this.#input, LOCKED_CLASS);
			}
		}
	}

	const TestId$2 = Object.freeze({
		start: 'mail-vacation-auto-reply-period-start',
		end: 'mail-vacation-auto-reply-period-end',
		format: 'mail-vacation-auto-reply-period-format',
		error: 'mail-vacation-auto-reply-error-period'
	});
	const InputId = Object.freeze({
		start: 'mail-vacation-auto-reply-start',
		end: 'mail-vacation-auto-reply-end'
	});
	function loc$2(phrase, replacements = null) {
		return main_core.Loc.getMessage(phrase, replacements) ?? '';
	}
	function createAdapterRuntime() {
		let startAdapter = null;
		let endAdapter = null;
		const adapterByName = name => {
			return name === 'start' ? startAdapter : endAdapter;
		};
		return {
			create(startInput, endInput, onStartChange, onEndChange) {
				this.destroy();
				startAdapter = ui_vue3.markRaw(new DatePickerAdapter({
					input: startInput,
					onChange: onStartChange
				}));
				endAdapter = ui_vue3.markRaw(new DatePickerAdapter({
					input: endInput,
					onChange: onEndChange
				}));
			},
			destroy() {
				startAdapter?.destroy();
				endAdapter?.destroy();
				startAdapter = null;
				endAdapter = null;
			},
			setValue(name, value) {
				adapterByName(name)?.setValue(value);
			},
			setDisabled(disabled) {
				startAdapter?.setDisabled(disabled);
				endAdapter?.setDisabled(disabled);
			},
			getRequestValue(name, loaded) {
				return adapterByName(name)?.getRequestValue(loaded) ?? toRequestBound(readBound(loaded));
			},
			getFormatExample() {
				return startAdapter?.getFormatExample() ?? '';
			},
			focusStart() {
				startAdapter?.focus();
			}
		};
	}
	function resolveRefElement(ref) {
		if (main_core.Type.isElementNode(ref)) {
			return ref;
		}
		const element = ref?.$el;
		return main_core.Type.isElementNode(element) ? element : null;
	}
	function resolveNativeInput(ref) {
		const element = resolveRefElement(ref);
		if (element === null) {
			return null;
		}
		if (element.tagName === 'INPUT') {
			return element;
		}
		return element.querySelector('input');
	}
	function decorateInput(input, name) {
		main_core.Dom.attr(input, {
			id: InputId[name],
			role: 'combobox',
			autocomplete: 'off',
			'data-testid': TestId$2[name]
		});
	}
	const PeriodField = ui_vue3.defineComponent({
		name: 'MailVacationAutoReplyPeriodField',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		props: {
			startsAt: {
				type: String,
				default: null
			},
			endsAt: {
				type: String,
				default: null
			},
			setting: {
				type: Object,
				default: undefined
			},
			timezoneId: {
				type: String,
				default: ''
			},
			fallbackTimezoneId: {
				type: String,
				default: ''
			},
			readonly: {
				type: Boolean,
				default: false
			},
			error: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				adapterRuntime: createAdapterRuntime(),
				inputDesign: ui_system_input_vue.InputDesign.LightGrey,
				inputSize: ui_system_input_vue.InputSize.Md,
				inputId: InputId,
				testId: TestId$2
			};
		},
		data() {
			return {
				startValue: '',
				endValue: '',
				formatExample: ''
			};
		},
		computed: {
			startLabel() {
				return loc$2('MAIL_VACATION_AUTO_REPLY_PERIOD_START_LABEL');
			},
			endLabel() {
				return loc$2('MAIL_VACATION_AUTO_REPLY_PERIOD_END_LABEL');
			},
			formatHint() {
				return this.formatExample === '' ? '' : loc$2('MAIL_VACATION_AUTO_REPLY_PERIOD_FORMAT_HINT', {
					'#EXAMPLE#': this.formatExample
				});
			},
			timezoneHint() {
				const timezoneId = resolveTimezoneId(this.timezoneId, this.fallbackTimezoneId);
				return loc$2('MAIL_VACATION_AUTO_REPLY_PERIOD_HINT', {
					'#TIMEZONE#': describeTimezone(timezoneId, loc$2('LANGUAGE_ID'))
				});
			}
		},
		watch: {
			startsAt(value) {
				if (this.setting === undefined) {
					this.syncLoadedBound('start', value);
				}
			},
			endsAt(value) {
				if (this.setting === undefined) {
					this.syncLoadedBound('end', value);
				}
			},
			setting(value) {
				if (value !== null && value !== undefined) {
					this.syncLoadedBounds(value.startsAt, value.endsAt);
				}
			},
			readonly(value) {
				this.setReadonly(value);
			}
		},
		mounted() {
			void this.$nextTick(() => {
				this.createAdapters();
				this.syncLoadedBounds(this.setting === undefined ? this.startsAt : this.setting?.startsAt ?? null, this.setting === undefined ? this.endsAt : this.setting?.endsAt ?? null);
				this.setReadonly(this.readonly);
			});
		},
		beforeUnmount() {
			this.adapterRuntime.destroy();
		},
		methods: {
			createAdapters() {
				const startInput = this.getInput('start');
				const endInput = this.getInput('end');
				if (startInput === null || endInput === null) {
					return;
				}
				decorateInput(startInput, 'start');
				decorateInput(endInput, 'end');
				this.adapterRuntime.create(startInput, endInput, () => this.syncDisplayValue('start'), () => this.syncDisplayValue('end'));
				this.formatExample = this.adapterRuntime.getFormatExample();
			},
			syncLoadedBounds(startsAt = undefined, endsAt = undefined) {
				const currentStartsAt = startsAt === undefined ? this.startsAt : startsAt;
				const currentEndsAt = endsAt === undefined ? this.endsAt : endsAt;
				this.syncLoadedBound('start', currentStartsAt);
				this.syncLoadedBound('end', currentEndsAt);
			},
			syncLoadedBound(name, value) {
				this.adapterRuntime.setValue(name, value);
				this.syncDisplayValue(name);
			},
			syncDisplayValue(name) {
				const input = this.getInput(name);
				if (input === null) {
					return;
				}
				if (name === 'start') {
					this.startValue = input.value;
					return;
				}
				this.endValue = input.value;
			},
			getInput(name) {
				const refs = this.$refs;
				return resolveNativeInput(name === 'start' ? refs.startField : refs.endField);
			},
			getRequestValues(loadedStartsAt = undefined, loadedEndsAt = undefined) {
				const currentStartsAt = loadedStartsAt === undefined ? this.startsAt : loadedStartsAt;
				const currentEndsAt = loadedEndsAt === undefined ? this.endsAt : loadedEndsAt;
				return {
					startsAt: this.adapterRuntime.getRequestValue('start', currentStartsAt),
					endsAt: this.adapterRuntime.getRequestValue('end', currentEndsAt)
				};
			},
			setReadonly(readonly) {
				this.adapterRuntime.setDisabled(readonly);
			},
			focusStart() {
				this.adapterRuntime.focusStart();
				if (document.activeElement === this.getInput('start')) {
					return true;
				}
				this.getInput('start')?.focus();
				return document.activeElement === this.getInput('start');
			},
			getErrorTarget() {
				const refs = this.$refs;
				const message = resolveRefElement(refs.error);
				const hint = resolveRefElement(refs.hint);
				const startInput = this.getInput('start');
				const endInput = this.getInput('end');
				const startField = resolveRefElement(refs.startField);
				const endField = resolveRefElement(refs.endField);
				return {
					message: message ?? document.createElement('div'),
					controls: [startInput, endInput, startField, endField].filter(Boolean),
					hint: hint ?? undefined,
					focus: () => this.focusStart()
				};
			}
		},
		template: `
		<div class="mail-vacation-auto-reply-form__row">
			<div class="mail-vacation-auto-reply-form__period">
				<div class="mail-vacation-auto-reply-form__bound">
					<label class="mail-vacation-auto-reply-form__label" :for="inputId.start">
						{{ startLabel }}
					</label>
					<BInput
						ref="startField"
						v-model="startValue"
						:design="inputDesign"
						:size="inputSize"
						:readonly="readonly"
						stretched
					/>
				</div>
				<div class="mail-vacation-auto-reply-form__bound">
					<label class="mail-vacation-auto-reply-form__label" :for="inputId.end">
						{{ endLabel }}
					</label>
					<BInput
						ref="endField"
						v-model="endValue"
						:design="inputDesign"
						:size="inputSize"
						:readonly="readonly"
						stretched
					/>
				</div>
			</div>
			<div
				ref="hint"
				:id="testId.format"
				class="mail-vacation-auto-reply-form__hint"
				:data-testid="testId.format"
			>{{ formatHint }}</div>
			<div class="mail-vacation-auto-reply-form__hint">{{ timezoneHint }}</div>
			<div
				ref="error"
				:id="testId.error"
				class="mail-vacation-auto-reply-form__error"
				data-role="error-period"
				:data-testid="testId.error"
			>{{ error }}</div>
		</div>
	`
	});

	const ACTIVE_LABEL_ID = 'mail-vacation-auto-reply-active-label';
	const READONLY_NOTE_ID = 'mail-vacation-auto-reply-readonly';
	const MAILBOX_ERROR_ID = 'mail-vacation-auto-reply-error-mailbox';
	const TestId$1 = Object.freeze({
		body: 'mail-vacation-auto-reply-form-body',
		status: 'mail-vacation-auto-reply-status',
		loader: 'mail-vacation-auto-reply-loader',
		failure: 'mail-vacation-auto-reply-failure',
		retry: 'mail-vacation-auto-reply-retry',
		empty: 'mail-vacation-auto-reply-empty',
		mailboxList: 'mail-vacation-auto-reply-mailbox-list',
		active: 'mail-vacation-auto-reply-active',
		readonly: READONLY_NOTE_ID
	});
	function loc$1(phrase) {
		return main_core.Loc.getMessage(phrase) ?? '';
	}
	function resolveElement(element) {
		return main_core.Type.isElementNode(element) ? element : null;
	}
	function createFallbackTarget() {
		return {
			message: document.createElement('div'),
			controls: []
		};
	}
	function ensureCoreSwitcherDestroy() {
		const switcher = ui_switcher.Switcher;
		if (main_core.Type.isFunction(switcher.prototype.destroy)) {
			return;
		}
		switcher.prototype.destroy = function () {
			const list = switcher.getList?.() ?? [];
			const index = list.indexOf(this);
			if (index >= 0) {
				list.splice(index, 1);
			}
		};
	}
	const ScreenContent = ui_vue3.defineComponent({
		name: 'MailVacationAutoReplyScreenContent',
		components: {
			Alert: ui_system_alert_vue.Alert,
			EditorHost,
			MailboxField,
			PeriodField,
			Switcher: ui_vue3_components_switcher.Switcher,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			mailboxListPath: {
				type: String,
				default: ''
			},
			timezoneId: {
				type: String,
				default: ''
			},
			editorId: {
				type: String,
				default: ''
			},
			editorNode: {
				type: Object,
				default: null
			},
			transport: {
				type: Object,
				default: null
			}
		},
		emits: ['retry', 'selectMailbox', 'changeActive'],
		setup() {
			ensureCoreSwitcherDestroy();
			return {
				alertDesign: ui_system_alert.AlertDesign,
				activeLabelId: ACTIVE_LABEL_ID,
				buttonSize: ui_vue3_components_button.ButtonSize.SMALL,
				readonlyNoteId: READONLY_NOTE_ID,
				retryStyle: ui_vue3_components_button.AirButtonStyle.OUTLINE,
				switcherOptions: Object.freeze({
					size: 'medium',
					useAirDesign: true,
					style: ui_switcher.AirSwitcherStyle.TINTED
				}),
				testId: TestId$1
			};
		},
		computed: {
			isLoading() {
				return this.state.status === ScreenStatus.Loading;
			},
			isBusy() {
				return this.isLoading || this.state.saving;
			},
			isFailed() {
				return this.state.status === ScreenStatus.Failed;
			},
			isEmpty() {
				return this.state.status === ScreenStatus.Empty;
			},
			isReady() {
				return this.state.status === ScreenStatus.Ready;
			},
			setting() {
				return this.state.setting;
			},
			isReadonly() {
				return this.setting?.canEdit !== true;
			},
			isFrozen() {
				return this.isReadonly || this.state.saving;
			},
			isActive() {
				return this.setting?.active === true;
			},
			selectedMailboxId: {
				get() {
					return this.state.mailboxId;
				},
				set(mailboxId) {
					this.$emit('selectMailbox', mailboxId);
				}
			},
			loadFailureMessage() {
				return this.state.loadFailure?.message ?? '';
			},
			busyStatusText() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_SAVE_WAIT');
			},
			canRetry() {
				return this.state.loadFailure?.retryable === true;
			},
			retryText() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_RETRY');
			},
			emptyText() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_NO_MAILBOX');
			},
			mailboxListText() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_MAILBOX_LIST');
			},
			readonlyText() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_READONLY');
			},
			activeLabel() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_ACTIVE_LABEL');
			},
			exclusionsHint() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_EXCLUSIONS_HINT');
			},
			signatureHint() {
				return loc$1('MAIL_VACATION_AUTO_REPLY_SIGNATURE_HINT');
			}
		},
		methods: {
			handleRetry() {
				this.$emit('retry');
			},
			handleActiveCheck() {
				this.changeActive(true);
			},
			handleActiveUncheck() {
				this.changeActive(false);
			},
			handleActiveToggle(event) {
				if (!main_core.Type.isElementNode(this.$el) || !this.$el.isConnected || !this.isReady || this.isReadonly || this.state.setting === null) {
					return;
				}
				event.preventDefault();
				this.changeActive(!this.isActive);
			},
			changeActive(active) {
				if (!this.isReady || this.isReadonly || this.state.setting === null) {
					return;
				}
				this.$emit('changeActive', active);
			},
			getActive() {
				return this.state.setting?.active === true;
			},
			getPeriodRequest(setting = undefined) {
				const period = this.$refs.period;
				const currentSetting = setting === undefined ? this.state.setting : setting;
				return period?.getRequestValues(currentSetting?.startsAt, currentSetting?.endsAt) ?? {
					startsAt: '',
					endsAt: ''
				};
			},
			getEditorBody() {
				return this.$refs.editor?.getBody() ?? '';
			},
			saveEditor() {
				return this.$refs.editor?.save() === true;
			},
			showEditorError(text) {
				this.$refs.editor?.showError(text);
			},
			clearEditorError() {
				this.$refs.editor?.clearError();
			},
			applySetting(setting) {
				const editor = this.$refs.editor;
				if (editor?.hasAdapter() !== true) {
					return false;
				}
				try {
					editor.getBody();
					return true;
				} catch {
					return false;
				}
			},
			setReadonly(readonly) {
				const refs = this.$refs;
				refs.period?.setReadonly(readonly);
				refs.editor?.setReadonly(readonly);
			},
			getFieldErrorTargets() {
				const refs = this.$refs;
				return {
					mailbox: this.getMailboxErrorTarget(),
					period: refs.period?.getErrorTarget() ?? createFallbackTarget(),
					body: refs.editor?.getErrorTarget() ?? createFallbackTarget()
				};
			},
			getMailboxErrorTarget() {
				const message = resolveElement(this.$el.querySelector(`#${MAILBOX_ERROR_ID}`)) ?? document.createElement('div');
				const input = this.$el.querySelector(`#${MailboxInputId}`);
				return {
					message,
					controls: main_core.Type.isElementNode(input) ? [input] : []
				};
			},
			getReadonlyNoteId() {
				return READONLY_NOTE_ID;
			}
		},
		template: `
		<div
			class="mail-vacation-auto-reply-form__surface --ui-context-content-light"
			:aria-busy="isBusy ? 'true' : 'false'"
		>
			<div
				v-show="isBusy"
				class="mail-vacation-auto-reply-form__status"
				:data-testid="testId.status"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>{{ busyStatusText }}</div>
			<div
				v-show="isLoading"
				class="mail-vacation-auto-reply-form__loader"
				:data-testid="testId.loader"
			></div>

			<div
				v-show="isFailed"
				class="mail-vacation-auto-reply-form__message"
				:data-testid="testId.failure"
				role="alert"
			>
				<Alert :design="alertDesign.tintedAlert">
					<div class="mail-vacation-auto-reply-form__message-content">
						<TextSm
							tag="span"
							class-name="mail-vacation-auto-reply-form__message-text"
						>{{ loadFailureMessage }}</TextSm>
						<span v-if="canRetry" class="mail-vacation-auto-reply-form__message-action">
							<UiButton
								:text="retryText"
								:size="buttonSize"
								:style="retryStyle"
								:dataset="{ testid: testId.retry }"
								@click="handleRetry"
							/>
						</span>
					</div>
				</Alert>
			</div>

			<div
				v-show="isEmpty"
				class="mail-vacation-auto-reply-form__message"
				:data-testid="testId.empty"
			>
				<Alert :design="alertDesign.tinted">
					<div class="mail-vacation-auto-reply-form__message-content">
						<TextSm
							tag="span"
							class-name="mail-vacation-auto-reply-form__message-text"
						>{{ emptyText }}</TextSm>
						<TextSm
							v-if="mailboxListPath !== ''"
							tag="a"
							class-name="mail-vacation-auto-reply-form__link"
							:href="mailboxListPath"
							:data-testid="testId.mailboxList"
						>{{ mailboxListText }}</TextSm>
					</div>
				</Alert>
			</div>

			<div
				v-show="isReady"
				class="mail-vacation-auto-reply-form__body"
				:class="{ '--readonly': isReadonly, '--saving': state.saving }"
				:data-testid="testId.body"
			>
				<MailboxField
					v-model="selectedMailboxId"
					:mailboxes="state.mailboxes"
					:error="state.fieldErrors.mailbox"
				/>
				<div
					v-show="isReadonly"
					:id="readonlyNoteId"
					class="mail-vacation-auto-reply-form__note --readonly"
					:data-testid="testId.readonly"
				>
					<Alert :design="alertDesign.tintedWarning">
						<TextSm>{{ readonlyText }}</TextSm>
					</Alert>
				</div>
				<div class="mail-vacation-auto-reply-form__row --inline">
					<TextSm
						tag="span"
						class-name="mail-vacation-auto-reply-form__label"
						:id="activeLabelId"
					>{{ activeLabel }}</TextSm>
					<Switcher
						class="mail-vacation-auto-reply-form__switcher"
						:data-testid="testId.active"
						role="switch"
						:tabindex="isFrozen ? -1 : 0"
						:aria-checked="String(isActive)"
						:aria-disabled="isFrozen ? 'true' : null"
						:is-checked="isActive"
						:is-disabled="isFrozen"
						:options="switcherOptions"
						:aria-labelledby="activeLabelId"
						@keydown.enter="handleActiveToggle"
						@keydown.space="handleActiveToggle"
						@check="handleActiveCheck"
						@uncheck="handleActiveUncheck"
					/>
				</div>
				<PeriodField
					ref="period"
					:setting="setting"
					:timezone-id="setting?.timezoneId ?? ''"
					:fallback-timezone-id="timezoneId"
					:readonly="isFrozen"
					:error="state.fieldErrors.period"
				/>
				<TextXs tag="div" class-name="mail-vacation-auto-reply-form__note">{{ exclusionsHint }}</TextXs>
				<TextXs tag="div" class-name="mail-vacation-auto-reply-form__note">{{ signatureHint }}</TextXs>
				<EditorHost
					ref="editor"
					:editor-id="editorId"
					:editor-node="editorNode"
					:transport="transport"
					:setting="setting"
					:readonly="isFrozen"
					:error="state.fieldErrors.body"
				/>
			</div>
		</div>
	`
	});

	const LegacyHostRole = 'mail-vacation-auto-reply-legacy-host';
	const App = ui_vue3.defineComponent({
		name: 'MailVacationAutoReplyApp',
		components: {
			ScreenContent
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			mailboxListPath: {
				type: String,
				default: ''
			},
			timezoneId: {
				type: String,
				default: ''
			},
			editorId: {
				type: String,
				default: ''
			},
			editorNode: {
				type: Object,
				default: null
			},
			transport: {
				type: Object,
				default: null
			},
			retryHandler: {
				type: Function,
				default: null
			},
			selectMailboxHandler: {
				type: Function,
				default: null
			},
			activeChangeHandler: {
				type: Function,
				default: null
			}
		},
		emits: ['retry', 'selectMailbox', 'changeActive'],
		setup() {
			return {
				legacyHostRole: LegacyHostRole
			};
		},
		methods: {
			content() {
				return this.$refs.content;
			},
			handleRetry() {
				this.$emit('retry');
				this.retryHandler?.();
			},
			handleSelectMailbox(mailboxId) {
				this.$emit('selectMailbox', mailboxId);
				this.selectMailboxHandler?.(mailboxId);
			},
			handleActiveChange(active) {
				this.$emit('changeActive', active);
				this.activeChangeHandler?.(active);
			},
			getActive() {
				return this.content().getActive();
			},
			getPeriodRequest(setting) {
				return this.content().getPeriodRequest(setting);
			},
			getEditorBody() {
				return this.content().getEditorBody();
			},
			saveEditor() {
				return this.content().saveEditor();
			},
			showEditorError(text) {
				this.content().showEditorError(text);
			},
			clearEditorError() {
				this.content().clearEditorError();
			},
			applySetting(setting) {
				return this.content().applySetting(setting);
			},
			setReadonly(readonly) {
				this.content().setReadonly(readonly);
			},
			getFieldErrorTargets() {
				return this.content().getFieldErrorTargets();
			},
			getReadonlyNoteId() {
				return this.content().getReadonlyNoteId();
			}
		},
		template: `
		<div
			class="mail-vacation-auto-reply-form"
			:data-role="legacyHostRole"
			:data-status="state.status"
			:data-saving="state.saving ? 'true' : 'false'"
		>
			<ScreenContent
				ref="content"
				:state="state"
				:mailbox-list-path="mailboxListPath"
				:timezone-id="timezoneId"
				:editor-id="editorId"
				:editor-node="editorNode"
				:transport="transport"
				@retry="handleRetry"
				@select-mailbox="handleSelectMailbox"
				@change-active="handleActiveChange"
			/>
		</div>
	`
	});

	class VacationAutoReplyTransport {
		#options;
		constructor(options) {
			this.#options = options;
		}
		save(payload) {
			const request = {
				...this.#options.readForm(payload),
				body: payload.signature
			};
			const pending = Api.save(request);
			this.#options.onStarted();
			return pending.then(response => {
				this.#options.onSaved(response.setting);
				return response.setting.mailboxId;
			}, reason => {
				const failure = parseSaveFailure(reason);
				this.#options.onFailure(failure);
				throw new Error(describeFailure(failure));
			});
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVED') ?? '';
		}
	}

	const EDITOR_ROLE = 'mail-vacation-auto-reply-editor';
	const SAVE_BUTTON_ID = 'ui-button-panel-save';
	const SAVE_BUTTON_WAIT_CLASS = 'ui-btn-wait';
	const TestId = Object.freeze({
		loader: 'mail-vacation-auto-reply-loader'
	});
	function loc(phrase) {
		return main_core.Loc.getMessage(phrase) ?? '';
	}
	function releaseSaveState(save) {
		if (save === null) {
			return;
		}
		main_core.Dom.attr(save, 'aria-disabled', null);
		main_core.Dom.attr(save, 'aria-describedby', null);
	}
	class Screen {
		static #instance = null;
		#params;
		#stateData = createScreenStateData();
		#state = new ScreenState(this.#stateData);
		#app = null;
		#root = null;
		#appContainer;
		#loader = null;
		#saveRequest = 0;
		#preparedSaveRequest = null;
		#destroyed = false;
		static init(params) {
			const container = document.getElementById(String(params?.containerId ?? ''));
			if (container === null) {
				return;
			}
			Screen.#instance?.destroy();
			Screen.#instance = new Screen(params, container);
		}
		static save() {
			Screen.#instance?.save();
		}
		constructor(params, container) {
			this.#params = params;
			this.#appContainer = container;
			const handleSaveFailure = createSaveFailureHandler(this.#state, () => this.#errorTargets(), () => this.#saveRequest);
			const transport = ui_vue3.markRaw(new VacationAutoReplyTransport({
				readForm: payload => this.#readForm(payload.signature),
				onStarted: () => this.#beginSave(),
				onSaved: setting => this.#applySaved(setting),
				onFailure: failure => {
					const wasSaving = this.#state.isSaving();
					try {
						handleSaveFailure(failure);
					} finally {
						this.#releaseCompletedSave(wasSaving);
					}
				}
			}));
			this.#root = this.#mountApplication(container, transport);
			const mailboxId = main_core.Text.toInteger(params.mailboxId);
			if (mailboxId > 0) {
				void this.#load(mailboxId);
			} else {
				this.#state.markEmpty();
				this.#showStatus();
			}
		}
		#mountApplication(container, transport) {
			const editorNode = this.#findEditorNode();
			this.#app = ui_vue3.BitrixVue.createApp(App, {
				state: this.#stateData,
				mailboxListPath: String(this.#params.mailboxListPath ?? ''),
				timezoneId: String(this.#params.timezoneId ?? ''),
				editorId: String(this.#params.editorId ?? ''),
				editorNode: editorNode === null ? null : ui_vue3.markRaw(editorNode),
				transport,
				retryHandler: () => this.#handleRetry(),
				selectMailboxHandler: mailboxId => this.#handleMailboxChange(mailboxId),
				activeChangeHandler: active => this.#handleActiveChange(active)
			});
			return this.#app.mount(container);
		}
		#findEditorNode() {
			const node = document.querySelector(`[data-role="${EDITOR_ROLE}"]`);
			return main_core.Type.isElementNode(node) ? node : null;
		}
		save() {
			const blocked = this.#describeSaveBlock();
			if (blocked !== '') {
				this.#root?.showEditorError(blocked);
				this.#releaseSaveButtonWaitIfIdle();
				return;
			}
			try {
				this.#preparedSaveRequest = this.#createSaveRequest();
			} catch (reason) {
				this.#preparedSaveRequest = null;
				this.#showGeneralSaveError(reason);
				this.#releaseSaveButtonWaitIfIdle();
				return;
			}
			try {
				if (this.#root?.saveEditor() !== true) {
					this.#preparedSaveRequest = null;
				}
			} catch (reason) {
				this.#preparedSaveRequest = null;
				this.#showGeneralSaveError(reason);
			}
			this.#releaseSaveButtonWaitIfIdle();
		}
		#describeSaveBlock() {
			if (this.#destroyed || this.#root === null) {
				return loc('MAIL_VACATION_AUTO_REPLY_SAVE_WAIT');
			}
			return describeSaveBlock(this.#state);
		}
		#beginSave() {
			this.#saveRequest = this.#state.beginSaving();
			this.#syncEditableState();
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			if (Screen.#instance === this) {
				Screen.#instance = null;
			}
			this.#state.stopWaiting();
			this.#preparedSaveRequest = null;
			releaseSaveState(this.#saveButton());
			this.#releaseSaveButtonWait();
			this.#loader?.destroy();
			this.#loader = null;
			this.#app?.unmount();
			this.#app = null;
			this.#root = null;
		}
		async #load(mailboxId) {
			const request = this.#state.beginLoading(mailboxId);
			this.#root?.clearEditorError();
			this.#showStatus();
			const loaded = await this.#read(request, mailboxId);
			if (!loaded) {
				return;
			}
			this.#applySetting();
			this.#showStatus();
		}
		async #read(request, mailboxId) {
			try {
				const response = await Api.get(mailboxId);
				return this.#state.applyLoaded(request, response);
			} catch (reason) {
				if (this.#state.failLoading(request, parseLoadFailure(reason))) {
					this.#showStatus();
				}
				return false;
			}
		}
		#createSaveRequest(body = null) {
			if (this.#root === null) {
				throw new Error('Vacation auto-reply application is not mounted.');
			}
			const setting = this.#state.getSetting();
			const period = this.#readPeriod(setting);
			const editorBody = body ?? this.#root.getEditorBody();
			return {
				mailboxId: this.#state.getSelectedMailboxId(),
				active: this.#activeFlag(this.#root.getActive()),
				startsAt: period.startsAt,
				endsAt: period.endsAt,
				timezoneId: this.#timezoneId(),
				body: editorBody
			};
		}
		#readForm(body) {
			const request = this.#preparedSaveRequest;
			this.#preparedSaveRequest = null;
			return request ?? this.#createSaveRequest(body);
		}
		#activeFlag(active) {
			return active ? 1 : 0;
		}
		#readPeriod(setting) {
			return this.#root?.getPeriodRequest(setting) ?? {
				startsAt: '',
				endsAt: ''
			};
		}
		#applySaved(setting) {
			const wasSaving = this.#state.isSaving();
			const applied = this.#state.applySaved(this.#saveRequest, setting);
			this.#releaseCompletedSave(wasSaving);
			if (!applied) {
				return;
			}
			this.#root?.clearEditorError();
			this.#applySetting();
		}
		#timezoneId() {
			return resolveTimezoneId(this.#state.getSetting()?.timezoneId, this.#params.timezoneId);
		}
		#applySetting() {
			const setting = this.#state.getSetting();
			if (setting === null) {
				return;
			}
			if (this.#root?.applySetting(setting) === false) {
				this.#root?.showEditorError(loc('MAIL_VACATION_AUTO_REPLY_LOAD_ERROR'));
			}
			this.#renderFieldErrors();
			this.#syncEditableState();
		}
		#handleActiveChange(active) {
			const setting = this.#state.getSetting();
			if (setting?.canEdit === true) {
				setting.active = active;
			}
			this.#root?.clearEditorError();
			this.#state.clearFieldErrors();
			this.#renderFieldErrors();
		}
		#handleMailboxChange(mailboxId) {
			if (mailboxId <= 0 || mailboxId === this.#state.getSelectedMailboxId()) {
				queueMicrotask(() => {
					this.#state.refreshMailboxSelection();
				});
				return;
			}
			if (this.#state.isSaving()) {
				queueMicrotask(() => {
					this.#state.refreshMailboxSelection();
				});
				return;
			}
			void this.#load(mailboxId);
		}
		#handleRetry() {
			const failure = this.#state.getLoadFailure();
			if (failure?.retryable !== true) {
				return;
			}
			const mailboxId = this.#state.getSelectedMailboxId();
			if (mailboxId <= 0) {
				return;
			}
			void this.#load(mailboxId);
		}
		#showStatus() {
			this.#syncLoader(this.#state.getStatus());
		}
		#syncLoader(status) {
			if (status !== ScreenStatus.Loading) {
				void this.#loader?.hide();
				return;
			}
			const target = this.#loaderTarget();
			if (target === null) {
				return;
			}
			this.#loader ??= new main_loader.Loader({
				target,
				size: 60
			});
			void this.#loader.show();
		}
		#loaderTarget() {
			const target = this.#appContainer.querySelector(`[data-testid="${TestId.loader}"]`);
			return main_core.Type.isElementNode(target) ? target : null;
		}
		#syncEditableState() {
			const editable = this.#state.canEdit();
			const save = this.#saveButton();
			if (editable) {
				releaseSaveState(save);
				return;
			}
			if (save === null) {
				return;
			}
			main_core.Dom.attr(save, 'aria-disabled', 'true');
			main_core.Dom.attr(save, 'aria-describedby', this.#root?.getReadonlyNoteId() ?? null);
		}
		#saveButton() {
			return document.getElementById(SAVE_BUTTON_ID);
		}
		#releaseCompletedSave(wasSaving) {
			if (wasSaving && !this.#destroyed) {
				this.#releaseSaveButtonWait();
				this.#syncEditableState();
			}
		}
		#releaseSaveButtonWaitIfIdle() {
			setTimeout(() => {
				if (!this.#destroyed && !this.#state.isSaving()) {
					this.#preparedSaveRequest = null;
					this.#releaseSaveButtonWait();
				}
			}, 0);
		}
		#releaseSaveButtonWait() {
			const saveButton = this.#saveButton();
			if (saveButton !== null) {
				main_core.Dom.removeClass(saveButton, SAVE_BUTTON_WAIT_CLASS);
			}
		}
		#renderFieldErrors() {
			renderFieldErrors(this.#errorTargets(), this.#state.getFieldErrors());
		}
		#errorTargets() {
			if (this.#root === null) {
				throw new Error('Vacation auto-reply application is not mounted.');
			}
			return this.#root.getFieldErrorTargets();
		}
		#showGeneralSaveError(reason) {
			if (this.#destroyed || this.#state.getStatus() !== ScreenStatus.Ready) {
				return;
			}
			this.#root?.showEditorError(describeFailure(parseSaveFailure(reason)));
		}
	}

	exports.Screen = Screen;

})(this.BX.Mail.Client.VacationAutoReply = this.BX.Mail.Client.VacationAutoReply || {}, BX, BX, BX.Vue3, BX.UI.System.Alert, BX.UI.System.Alert.Vue, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.UI, BX.UI.Vue3.Components, BX.Main, BX.Ui, BX.UI.Accessibility, BX.Mail.Signature.Editor, BX.UI.System.Input.Vue, BX.UI.DatePicker);
//# sourceMappingURL=vacation-auto-reply.bundle.js.map
