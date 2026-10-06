/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_date, main_core_cache, main_core_events, sign_v2_api, sign_type, ui_forms, sign_v2_b2e_signLink, ui_formElements_view, ui_datePicker) {
	'use strict';

	class DatePickerField extends ui_formElements_view.BaseField {
		#datepicker;
		#inputNode;
		constructor(params) {
			super(params);
			this.defaultValue = main_core.Type.isStringFilled(params.value) ? params.value : '';
			this.#datepicker = new ui_datePicker.DatePicker({
				type: 'date',
				inputField: this.getInputNode(),
				targetNode: this.getInputNode()
			});
		}
		getValue() {
			return this.getInputNode().value;
		}
		getInputNode() {
			this.#inputNode ??= this.#renderInputNode();
			return this.#inputNode;
		}
		#renderInputNode() {
			return main_core.Tag.render`
			<input
				value="${main_core.Text.encode(this.defaultValue)}" 
				name="${main_core.Text.encode(this.getName())}" 
				type="text" 
				class="ui-ctl-element --readonly" 
				readonly
			>
		`;
		}
		renderContentField() {
			const lockElement = !this.isEnable ? this.renderLockElement() : null;
			return main_core.Tag.render`
			<div id="${this.getId()}" class="ui-section__field-selector">
				<div class="ui-section__field-container">
					<div class="ui-section__field-label_box">
						<label for="${this.getName()}" class="ui-section__field-label">
							${this.getLabel()}
						</label> 
						${lockElement}
					</div>  
					<div class="ui-ctl ui-ctl-textbox ui-ctl-block ui-ctl-after-icon ${this.inputDefaultWidth ? '' : 'ui-ctl-w100'}">
						<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
						${this.getInputNode()}
					</div>
					${this.renderErrors()}
				</div>
				<div class="ui-section__hint">
					${this.hintTitle}
				</div>
			</div>
		`;
		}
	}

	var readyToSendImage = "/bitrix/js/sign/v2/b2e/submit-document-info/dist/assets/ready-to-send-state-image.svg";

	// autotest anchors; regNumber and date are prefixes shared by the field wrapper,
	// its input and its error container, so the names cannot drift apart
	const TestId = Object.freeze({
		regNumber: 'sign-submit-document-info-reg-number',
		date: 'sign-submit-document-info-date'
	});

	// Error codes of Operation\Document\Template\Send: the failed field is found by code, because the
	// message text is translated on each side independently and cannot be compared
	const ServerErrorCode = Object.freeze({
		externalIdRequired: 'SIGN_B2E_TEMPLATE_SEND_EXTERNAL_ID_REQUIRED',
		externalDateRequired: 'SIGN_B2E_TEMPLATE_SEND_EXTERNAL_DATE_REQUIRED',
		externalDateInvalid: 'SIGN_B2E_TEMPLATE_SEND_EXTERNAL_DATE_INVALID'
	});
	function sleep(ms) {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}
	class SubmitDocumentInfo extends main_core_events.EventEmitter {
		events = Object.freeze({
			onProgressClosePageBtnClick: 'onProgressClosePageBtnClick',
			documentSendedSuccessFully: 'documentSendedSuccessFully'
		});
		#cache = new main_core_cache.MemoryCache();
		#layoutCache = new main_core_cache.MemoryCache();
		#options;
		#api = new sign_v2_api.Api();
		#fieldFormId = 'sign-b2e-employee-fields-form';
		#uiFields = [];
		#externalIdField = null;
		#externalDateField = null;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.SubmitDocumentInfo');
			this.#options = options;
		}
		#getProgressLayout() {
			return this.#layoutCache.remember('progressLayout', () => main_core.Tag.render`
				<div class="sign-b2e-submit-document-info__progress">
					<div class="sign-b2e-submit-document-info__progress_icon"></div>
					<h2 class="sign-b2e-submit-document-info__progress_head">
						${main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_PROGRESS_HEAD')}
					</h2>
					<p class="sign-b2e-submit-document-info__progress_description">
						${main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_PROGRESS_DESCRIPTION')}
					</p>
					<button
						class="ui-btn ui-btn-round ui-btn-light-border"
						onclick="${() => this.#onProgressClosePageBtnClick()}"
					>
						${main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_PROGRESS_CLOSE')}
					</button>
				</div>
			`);
		}
		#showProgress() {
			main_core.Dom.append(this.#getProgressLayout(), this.getLayout());
		}
		#hideProgress() {
			main_core.Dom.remove(this.#getProgressLayout());
		}
		#onProgressClosePageBtnClick() {
			this.emit(this.events.onProgressClosePageBtnClick);
			BX.SidePanel.Instance.close();
		}
		getLayout() {
			return this.#layoutCache.remember('layout', () => {
				const showRegistrationNumberField = this.#options.showRegistrationNumberField === true;
				const showCreationDateField = this.#options.showCreationDateField === true;
				const hasRegionalFields = showRegistrationNumberField || showCreationDateField;
				const hasTemplateFields = this.#options.fields.length > 0;
				if (!hasTemplateFields && !hasRegionalFields) {
					const title = this.#options.isOnboarding ? main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_ONBOARDING_TITLE') : main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_TITLE');
					const description = this.#options.isOnboarding ? main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_ONBOARDING_DESCRIPTION') : main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_DESCRIPTION', {
						'#TITLE#': main_core.Text.encode(this.#options.template.title)
					});
					return main_core.Tag.render`
						<div class="sign-submit-document-info-center-container">
							<div class="sign-submit-document-info-center-icon">
								<img src="${readyToSendImage}" alt="">
							</div>
							<p class="sign-submit-document-info-center-title">
								${main_core.Text.encode(title)}
							</p>
							<p class="sign-submit-document-info-center-description">
								${description}
							</p>
							<form id="${this.#fieldFormId}"></form>
						</div>
					`;
				}
				const fieldsSection = hasTemplateFields ? main_core.Tag.render`
						<div class="sign-b2e-settings__item">
							<p class="sign-b2e-settings__item_title">
								${main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_DESCRIPTION')}
							</p>
							<form id="${this.#fieldFormId}">
								${this.#getFieldsLayout()}
							</form>
						</div>
					` : main_core.Tag.render`<form id="${this.#fieldFormId}"></form>`;
				return main_core.Tag.render`
					<div class="sign-b2e-submit-document-info">
						<h1 class="sign-b2e-settings__header">${main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_HEAD')}</h1>
						${hasRegionalFields ? this.#getRegionalFieldsLayout() : ''}
						${fieldsSection}
					</div>
				`;
			});
		}
		#getRegionalFieldsLayout() {
			return this.#layoutCache.remember('regionalLayout', () => {
				const fieldLayouts = [];
				if (this.#options.showRegistrationNumberField === true) {
					// Pre-fill the registration number with the canonical "no number" default from the company flow
					// (DocumentRegionalSettings.getExternalIdDefaultValue -> SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_WITHOUT_NUMBER).
					this.#externalIdField = new ui_formElements_view.TextInput({
						label: this.#getFieldLabel(main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REG_NUMBER_LABEL'), true),
						inputName: 'sign-b2e-external-id',
						value: main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REG_NUMBER_WITHOUT_NUMBER')
					});
					main_core.Dom.attr(this.#externalIdField.getInputNode(), 'data-testid', `${TestId.regNumber}-input`);
					this.#markFieldRequired(this.#externalIdField);
					this.#prepareErrorContainer(this.#externalIdField, TestId.regNumber);
					fieldLayouts.push(main_core.Tag.render`
					<div class="sign-b2e-submit-document-info__field" data-testid="${TestId.regNumber}-field">
						${this.#externalIdField.render()}
					</div>
				`);
				}
				if (this.#options.showCreationDateField === true) {
					const todayFormatted = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), new Date());
					this.#externalDateField = new DatePickerField({
						label: this.#getFieldLabel(main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_DATE_CREATE_LABEL'), true),
						inputName: 'sign-b2e-external-date',
						value: todayFormatted
					});
					main_core.Dom.attr(this.#externalDateField.getInputNode(), 'data-testid', `${TestId.date}-input`);
					this.#markFieldRequired(this.#externalDateField);
					this.#prepareErrorContainer(this.#externalDateField, TestId.date);
					fieldLayouts.push(main_core.Tag.render`
					<div class="sign-b2e-submit-document-info__field" data-testid="${TestId.date}-field">
						${this.#externalDateField.render()}
					</div>
				`);
				}
				return main_core.Tag.render`
				<div class="sign-b2e-settings__item">
					<p class="sign-b2e-settings__item_title">
						${main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REGIONAL_TITLE')}
					</p>
					${fieldLayouts}
				</div>
			`;
			});
		}
		#getExternalIdValue() {
			return this.#externalIdField ? this.#externalIdField.getValue() : null;
		}
		#getExternalDateValue() {
			return this.#externalDateField ? this.#externalDateField.getValue() : null;
		}
		async sendForSign() {
			const currentSidePanel = BX.SidePanel.Instance.getTopSlider();
			if (!this.#isFieldsValid()) {
				return false;
			}
			let employeeMember = null;
			let assigneeMember = null;
			let document = null;
			main_core_events.EventEmitter.emit('BX.Sign.SignSettingsEmployee:onBeforeTemplateSend');
			try {
				const sendResult = await this.#api.template.send(this.#options.template.uid, this.#getFieldValues(), this.#options.isOnboarding, this.#getExternalIdValue(), this.#getExternalDateValue());
				assigneeMember = sendResult.assigneeMember;
				employeeMember = sendResult.employeeMember;
				document = sendResult.document;
			} catch (e) {
				console.error(e);
				this.#showServerErrorsOnFields(e);
				return false;
			} finally {
				main_core_events.EventEmitter.emit('BX.Sign.SignSettingsEmployee:onAfterTemplateSend');
			}
			const {
				uid: memberUid,
				id: memberId
			} = this.#options.isOnboarding ? assigneeMember : employeeMember;
			this.emit(this.events.documentSendedSuccessFully, {
				document
			});
			this.#showProgress();
			let pending = true;
			let openSigningSliderAfterPending = true;
			const signLink = new sign_v2_b2e_signLink.SignLink({
				memberId
			});
			main_core_events.EventEmitter.subscribeOnce(currentSidePanel, 'SidePanel.Slider:onCloseStart', () => {
				pending = false;
				openSigningSliderAfterPending = false;
			});
			BX.PULL?.subscribe({
				moduleId: 'sign',
				command: 'memberInvitedToSign',
				callback: async params => {
					if (params.member.id !== memberId || !pending || !openSigningSliderAfterPending) {
						return;
					}
					pending = false;
					await this.#openSigningSliderAndCloseCurrent(signLink);
				}
			});
			do {
				await sleep(5000);
				if (!openSigningSliderAfterPending) {
					return true;
				}
				if (!pending) {
					break;
				}
				let status = null;
				try {
					status = (await this.#api.getMember(memberUid)).status;
				} catch (e) {
					console.error(e);
					this.#hideProgress();
					return false;
				}
				if (status === sign_type.MemberStatus.ready || status === sign_type.MemberStatus.stoppableReady) {
					pending = false;
				}
			} while (pending);
			if (openSigningSliderAfterPending) {
				await this.#openSigningSliderAndCloseCurrent(signLink);
			}
			return true;
		}
		async #openSigningSliderAndCloseCurrent(signLink) {
			return this.#cache.remember('openSigningSliderAndCloseCurrent', async () => {
				const currentSidePanel = BX.SidePanel.Instance.getTopSlider();
				// load signing data before close current slider
				await signLink.preloadData();
				if (main_core.Type.isNull(currentSidePanel)) {
					signLink.openSlider({
						events: {}
					});
				} else {
					currentSidePanel.close(false, () => signLink.openSlider({
						events: {}
					}));
				}
			});
		}
		#getFieldsLayout() {
			return this.#options.fields.map(field => this.#getOrCreateFieldLayout(field));
		}
		#getOrCreateFieldLayout(field) {
			return this.#layoutCache.remember(`fieldLayout.${field.uid}`, () => {
				const fieldsLayoutCallbackByType = this.#getFieldLayoutCallback(field);
				if (main_core.Type.isNull(fieldsLayoutCallbackByType)) {
					throw new TypeError(`Unknown field type: ${field.type}`);
				}
				return fieldsLayoutCallbackByType(field);
			});
		}
		#getFieldLabel(name, required) {
			return `
			<span>
				${main_core.Text.encode(name)}
				${required ? this.#getRequiredMarker() : ''}
			</span>
		`;
		}

		// no test anchor here: the marker is decorative (aria-hidden) and repeats on every required field,
		// so a shared testid would break getByTestId; a test reads aria-required on the input instead
		#getRequiredMarker() {
			return `
			<span class="sign-b2e-submit-document-info__field_required" aria-hidden="true">*</span>
		`;
		}
		#getFieldLayoutCallback(field) {
			const label = this.#getFieldLabel(field.name, field.required);
			const fieldsLayoutCallbackByType = {
				date: () => {
					const datePickerField = new DatePickerField({
						label,
						inputName: field.uid,
						value: field.value
					});
					this.#registerUiField(datePickerField, field.required);
					return main_core.Tag.render`
					<div class="sign-b2e-submit-document-info__field">
						${datePickerField.render()}
					</div>
				`;
				},
				string: () => {
					const fieldInput = new ui_formElements_view.TextInput({
						label,
						inputName: field.uid,
						value: field.value
					});
					this.#registerUiField(fieldInput, field.required);
					return main_core.Tag.render`
					<div class="sign-b2e-submit-document-info__field">
						${fieldInput.render()}
					</div>
				`;
				},
				list: () => {
					const selector = new ui_formElements_view.Selector({
						label,
						name: field.uid,
						inputName: field.uid,
						items: this.#getSelectorItemsWithEmpty(field)
					});
					this.#registerUiField(selector, field.required);
					return main_core.Tag.render`
					<div class="sign-b2e-submit-document-info__field">
						${selector.render()}
					</div>
				`;
				},
				// @TODO address picker
				address: () => main_core.Tag.render`
				<div class="sign-b2e-submit-document-info__field">
					<span class="sign-b2e-submit-document-info__label">
						${main_core.Text.encode(field.name)}
					</span>
					<div class="sign-b2e-submit-document-info__subfields">
						${field.subfields.map(subfield => main_core.Tag.render`
							<div>${this.#getOrCreateFieldLayout(subfield)}</div>
						`)}
					</div>
				</div>
			`
			};
			const defaultLayout = () => main_core.Tag.render`<div></div>`;
			return fieldsLayoutCallbackByType[field.type] ?? defaultLayout;
		}
		#registerUiField(uiField, required) {
			this.#uiFields.push(uiField);
			if (required) {
				this.#markFieldRequired(uiField);
			}
		}

		// aria-required instead of the native attribute: the date input is readonly (native required does not work there)
		// and the form is sent from JS, so native validation must not start on the text inputs either
		#markFieldRequired(uiField) {
			main_core.Dom.attr(uiField.getInputNode(), 'aria-required', 'true');
		}
		#getFieldValues() {
			const form = document.getElementById(this.#fieldFormId);
			const formData = new FormData(form);
			const fieldValues = [];
			formData.forEach((value, name) => {
				fieldValues.push({
					name,
					value
				});
			});
			return fieldValues;
		}
		#isFieldsValid() {
			const invalidFields = [];

			// regional fields are rendered above the template ones, so the fields are collected in visual order
			this.#getRenderedRegionalFields().forEach(({
				field,
				errorMessage
			}) => {
				this.#cleanFieldError(field);
				if (field.getValue()?.trim() === '') {
					this.#setFieldError(field, errorMessage);
					invalidFields.push(field);
				}
			});
			this.#uiFields.forEach(domField => {
				this.#cleanFieldError(domField);
				const templateField = this.#getFieldByUid(domField.getName());
				if (!templateField) {
					return;
				}
				if (templateField.required && domField.getValue()?.trim() === '') {
					this.#setFieldError(domField);
					invalidFields.push(domField);
				}
			});
			invalidFields[0]?.getInputNode().focus();
			return invalidFields.length === 0;
		}

		// A regional field is rendered only when the blank really has its placeholder block, so a rendered
		// field is always required (the same condition is checked by the server in Operation\Document\Template\Send).
		// errorMessage is shown by the local check before sending; a server refusal is matched by
		// serverErrorCodes and shows the message the server sent.
		#getRenderedRegionalFields() {
			const fields = [];
			if (this.#externalIdField !== null) {
				fields.push({
					field: this.#externalIdField,
					errorMessage: main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REG_NUMBER_REQUIRED_ERROR'),
					serverErrorCodes: [ServerErrorCode.externalIdRequired]
				});
			}
			if (this.#externalDateField !== null) {
				fields.push({
					field: this.#externalDateField,
					errorMessage: main_core.Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_DATE_CREATE_REQUIRED_ERROR'),
					serverErrorCodes: [ServerErrorCode.externalDateRequired, ServerErrorCode.externalDateInvalid]
				});
			}
			return fields;
		}

		// role is set on the empty container upfront: a live region announces only the changes
		// that happen after it is already in the DOM
		#prepareErrorContainer(uiField, testId) {
			main_core.Dom.attr(uiField.renderErrors(), {
				id: this.#getErrorContainerId(uiField),
				role: 'alert',
				'data-testid': `${testId}-error`
			});
		}
		#getErrorContainerId(uiField) {
			return `${uiField.getId()}-error`;
		}

		// Template fields are marked invalid without a message, so they are described by nothing:
		// only regional fields have an error container prepared with the id to point at
		#setFieldError(uiField, errorMessage = null) {
			const hasMessage = errorMessage !== null;
			uiField.setErrors(hasMessage ? [errorMessage] : []);
			main_core.Dom.addClass(uiField.getErrorBox(), '--error');
			main_core.Dom.attr(uiField.getInputNode(), {
				'aria-invalid': 'true',
				'aria-describedby': hasMessage ? this.#getErrorContainerId(uiField) : null
			});
		}
		#cleanFieldError(uiField) {
			uiField.cleanError();
			main_core.Dom.attr(uiField.getInputNode(), {
				'aria-invalid': null,
				'aria-describedby': null
			});
		}

		// sign.v2.api already notifies with the server message, so here it is only bound to the field it belongs
		// to. An error with no rendered field behind it (an outdated form, for example) stays in the
		// notification alone.
		#showServerErrorsOnFields(error) {
			const regionalFields = this.#getRenderedRegionalFields();
			const failedFields = [];
			this.#getServerErrors(error).forEach(({
				code,
				message
			}) => {
				const failedField = regionalFields.find(regionalField => this.#matchesServerError(regionalField, code, message));
				if (failedField && !failedFields.includes(failedField)) {
					this.#setFieldError(failedField.field, message);
					failedFields.push(failedField);
				}
			});
			failedFields[0]?.field.getInputNode().focus();
		}

		// The code is the reliable signal; the message is compared only when the error came without a code,
		// which happens when sign.v2.api rethrows a plain Error built from the first message
		#matchesServerError(regionalField, code, message) {
			if (main_core.Type.isStringFilled(code)) {
				return regionalField.serverErrorCodes.includes(code);
			}
			return message === regionalField.errorMessage;
		}
		#getServerErrors(error) {
			if (main_core.Type.isArrayFilled(error?.errors)) {
				return error.errors.map(({
					code,
					message
				}) => ({
					code: code ?? '',
					message
				}));
			}
			return main_core.Type.isStringFilled(error?.message) ? [{
				code: '',
				message: error.message
			}] : [];
		}
		#getFieldByUid(uid) {
			return this.#findFieldByUidRecursive(uid, this.#options.fields);
		}
		#findFieldByUidRecursive(uid, fields) {
			for (const field of fields) {
				if (field.uid === uid) {
					return field;
				}
				if (field.subfields) {
					const subfield = this.#findFieldByUidRecursive(uid, field.subfields);
					if (subfield) {
						return subfield;
					}
				}
			}
			return null;
		}
		#getSelectorItemsWithEmpty(field) {
			const items = [];
			const fieldItems = main_core.Type.isArray(field.items) ? field.items : [];
			if (!fieldItems.some(item => item.code === field.value)) {
				items.push({
					value: '',
					name: '',
					selected: true,
					hidden: true,
					disabled: true
				});
			}
			fieldItems.forEach(item => {
				items.push({
					value: main_core.Text.encode(item.code),
					name: main_core.Text.encode(item.label),
					selected: item.code === field.value
				});
			});
			return items;
		}
	}

	exports.SubmitDocumentInfo = SubmitDocumentInfo;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Main, BX.Cache, BX.Event, BX.Sign.V2, BX.Sign, BX, BX.Sign.V2.B2e, BX.UI.FormElements, BX.UI.DatePicker);
//# sourceMappingURL=submit-document-info.bundle.js.map
