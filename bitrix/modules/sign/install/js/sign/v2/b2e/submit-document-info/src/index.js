import { Dom, Loc, Tag, Text, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { MemoryCache } from 'main.core.cache';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { Api } from 'sign.v2.api';
import type { FieldValue, TemplateField } from 'sign.v2.api';
import type { ProviderCodeType, MemberStatusType } from 'sign.type';
import { MemberStatus } from 'sign.type';
import './style.css';
import 'ui.forms';
import { SignLink } from 'sign.v2.b2e.sign-link';
import { BaseField, Selector, TextInput } from 'ui.form-elements.view';
import { DatePickerField } from './date-picker-field';
import readyToSendImage from './images/ready-to-send-state-image.svg';

// autotest anchors; regNumber and date are prefixes shared by the field wrapper,
// its input and its error container, so the names cannot drift apart
const TestId = Object.freeze({
	regNumber: 'sign-submit-document-info-reg-number',
	date: 'sign-submit-document-info-date',
});

// Error codes of Operation\Document\Template\Send: the failed field is found by code, because the
// message text is translated on each side independently and cannot be compared
const ServerErrorCode = Object.freeze({
	externalIdRequired: 'SIGN_B2E_TEMPLATE_SEND_EXTERNAL_ID_REQUIRED',
	externalDateRequired: 'SIGN_B2E_TEMPLATE_SEND_EXTERNAL_DATE_REQUIRED',
	externalDateInvalid: 'SIGN_B2E_TEMPLATE_SEND_EXTERNAL_DATE_INVALID',
});

function sleep(ms: number): Promise<void>
{
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

type Options = {
	template: {
		uid: string,
		title: string,
	},
	fields: Array<TemplateField>,
	isOnboarding: boolean;
	showRegistrationNumberField?: boolean;
	showCreationDateField?: boolean;
};

type RequiredRegionalField = {
	field: BaseField,
	errorMessage: string,
	serverErrorCodes: string[],
};

type ServerError = {
	code: string,
	message: string,
};

type MemberInvitedToSignEventData = {
	documentUid: string,
	member: { id: number, uid: string },
	signingLink: string
};

export type DocumentSendedSuccessFullyEvent = BaseEvent<{ document: { id: number, providerCode: ProviderCodeType } }>;

export class SubmitDocumentInfo extends EventEmitter
{
	events = Object.freeze({
		onProgressClosePageBtnClick: 'onProgressClosePageBtnClick',
		documentSendedSuccessFully: 'documentSendedSuccessFully',
	});

	#cache: MemoryCache<any> = new MemoryCache();
	#layoutCache: MemoryCache<HTMLElement> = new MemoryCache();
	#options: Options;
	#api: Api = new Api();
	#fieldFormId: string = 'sign-b2e-employee-fields-form';
	#uiFields: BaseField[] = [];
	#externalIdField: ?TextInput = null;
	#externalDateField: ?DatePickerField = null;

	constructor(options: Options)
	{
		super();
		this.setEventNamespace('BX.Sign.V2.B2e.SubmitDocumentInfo');
		this.#options = options;
	}

	#getProgressLayout(): HTMLElement
	{
		return this.#layoutCache.remember(
			'progressLayout',
			() => Tag.render`
				<div class="sign-b2e-submit-document-info__progress">
					<div class="sign-b2e-submit-document-info__progress_icon"></div>
					<h2 class="sign-b2e-submit-document-info__progress_head">
						${Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_PROGRESS_HEAD')}
					</h2>
					<p class="sign-b2e-submit-document-info__progress_description">
						${Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_PROGRESS_DESCRIPTION')}
					</p>
					<button
						class="ui-btn ui-btn-round ui-btn-light-border"
						onclick="${() => this.#onProgressClosePageBtnClick()}"
					>
						${Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_PROGRESS_CLOSE')}
					</button>
				</div>
			`,
		);
	}

	#showProgress(): void
	{
		Dom.append(this.#getProgressLayout(), this.getLayout());
	}

	#hideProgress(): void
	{
		Dom.remove(this.#getProgressLayout());
	}

	#onProgressClosePageBtnClick(): void
	{
		this.emit(this.events.onProgressClosePageBtnClick);
		BX.SidePanel.Instance.close();
	}

	getLayout(): HTMLElement
	{
		return this.#layoutCache.remember(
			'layout',
			() => {
				const showRegistrationNumberField = this.#options.showRegistrationNumberField === true;
				const showCreationDateField = this.#options.showCreationDateField === true;
				const hasRegionalFields = showRegistrationNumberField || showCreationDateField;
				const hasTemplateFields = this.#options.fields.length > 0;
				if (!hasTemplateFields && !hasRegionalFields)
				{
					const title = this.#options.isOnboarding
						? Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_ONBOARDING_TITLE')
						: Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_TITLE')
					;
					const description = this.#options.isOnboarding
						? Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_ONBOARDING_DESCRIPTION')
						: Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_READY_TO_SEND_DESCRIPTION', { '#TITLE#': Text.encode(this.#options.template.title) })
					;

					return Tag.render`
						<div class="sign-submit-document-info-center-container">
							<div class="sign-submit-document-info-center-icon">
								<img src="${readyToSendImage}" alt="">
							</div>
							<p class="sign-submit-document-info-center-title">
								${Text.encode(title)}
							</p>
							<p class="sign-submit-document-info-center-description">
								${description}
							</p>
							<form id="${this.#fieldFormId}"></form>
						</div>
					`;
				}

				const fieldsSection = hasTemplateFields
					? Tag.render`
						<div class="sign-b2e-settings__item">
							<p class="sign-b2e-settings__item_title">
								${Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_DESCRIPTION')}
							</p>
							<form id="${this.#fieldFormId}">
								${this.#getFieldsLayout()}
							</form>
						</div>
					`
					: Tag.render`<form id="${this.#fieldFormId}"></form>`
				;

				return Tag.render`
					<div class="sign-b2e-submit-document-info">
						<h1 class="sign-b2e-settings__header">${Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_HEAD')}</h1>
						${hasRegionalFields ? this.#getRegionalFieldsLayout() : ''}
						${fieldsSection}
					</div>
				`;
			},
		);
	}

	#getRegionalFieldsLayout(): HTMLElement
	{
		return this.#layoutCache.remember('regionalLayout', () => {
			const fieldLayouts: HTMLElement[] = [];

			if (this.#options.showRegistrationNumberField === true)
			{
				// Pre-fill the registration number with the canonical "no number" default from the company flow
				// (DocumentRegionalSettings.getExternalIdDefaultValue -> SIGN_V2_B2E_REGIONAL_SETTINGS_DOCUMENT_EXTERNAL_ID_WITHOUT_NUMBER).
				this.#externalIdField = new TextInput({
					label: this.#getFieldLabel(Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REG_NUMBER_LABEL'), true),
					inputName: 'sign-b2e-external-id',
					value: Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REG_NUMBER_WITHOUT_NUMBER'),
				});
				Dom.attr(
					this.#externalIdField.getInputNode(),
					'data-testid',
					`${TestId.regNumber}-input`,
				);
				this.#markFieldRequired(this.#externalIdField);
				this.#prepareErrorContainer(this.#externalIdField, TestId.regNumber);
				fieldLayouts.push(Tag.render`
					<div class="sign-b2e-submit-document-info__field" data-testid="${TestId.regNumber}-field">
						${this.#externalIdField.render()}
					</div>
				`);
			}

			if (this.#options.showCreationDateField === true)
			{
				const todayFormatted = DateTimeFormat.format(
					DateTimeFormat.getFormat('SHORT_DATE_FORMAT'),
					new Date(),
				);
				this.#externalDateField = new DatePickerField({
					label: this.#getFieldLabel(Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_DATE_CREATE_LABEL'), true),
					inputName: 'sign-b2e-external-date',
					value: todayFormatted,
				});
				Dom.attr(
					this.#externalDateField.getInputNode(),
					'data-testid',
					`${TestId.date}-input`,
				);
				this.#markFieldRequired(this.#externalDateField);
				this.#prepareErrorContainer(this.#externalDateField, TestId.date);
				fieldLayouts.push(Tag.render`
					<div class="sign-b2e-submit-document-info__field" data-testid="${TestId.date}-field">
						${this.#externalDateField.render()}
					</div>
				`);
			}

			return Tag.render`
				<div class="sign-b2e-settings__item">
					<p class="sign-b2e-settings__item_title">
						${Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REGIONAL_TITLE')}
					</p>
					${fieldLayouts}
				</div>
			`;
		});
	}

	#getExternalIdValue(): ?string
	{
		return this.#externalIdField ? this.#externalIdField.getValue() : null;
	}

	#getExternalDateValue(): ?string
	{
		return this.#externalDateField ? this.#externalDateField.getValue() : null;
	}

	async sendForSign(): Promise<boolean>
	{
		const currentSidePanel = BX.SidePanel.Instance.getTopSlider();
		if (!this.#isFieldsValid())
		{
			return false;
		}

		let employeeMember = null;
		let assigneeMember = null;
		let document: null | { id: number, providerCode: ProviderCodeType } = null;
		EventEmitter.emit('BX.Sign.SignSettingsEmployee:onBeforeTemplateSend');
		try
		{
			const sendResult = await this.#api.template.send(
				this.#options.template.uid,
				this.#getFieldValues(),
				this.#options.isOnboarding,
				this.#getExternalIdValue(),
				this.#getExternalDateValue(),
			);
			assigneeMember = sendResult.assigneeMember;
			employeeMember = sendResult.employeeMember;
			document = sendResult.document;
		}
		catch (e)
		{
			console.error(e);
			this.#showServerErrorsOnFields(e);

			return false;
		}
		finally
		{
			EventEmitter.emit('BX.Sign.SignSettingsEmployee:onAfterTemplateSend');
		}
		const { uid: memberUid, id: memberId } = this.#options.isOnboarding ? assigneeMember : employeeMember;
		this.emit(this.events.documentSendedSuccessFully, { document });

		this.#showProgress();
		let pending = true;
		let openSigningSliderAfterPending = true;
		const signLink = new SignLink({ memberId });

		EventEmitter.subscribeOnce(currentSidePanel, 'SidePanel.Slider:onCloseStart', () => {
			pending = false;
			openSigningSliderAfterPending = false;
		});

		BX.PULL?.subscribe({
			moduleId: 'sign',
			command: 'memberInvitedToSign',
			callback: async (params: MemberInvitedToSignEventData): Promise<void> => {
				if (params.member.id !== memberId || !pending || !openSigningSliderAfterPending)
				{
					return;
				}

				pending = false;
				await this.#openSigningSliderAndCloseCurrent(signLink);
			},
		});

		do
		{
			await sleep(5000);
			if (!openSigningSliderAfterPending)
			{
				return true;
			}

			if (!pending)
			{
				break;
			}
			let status: MemberStatusType | null = null;
			try
			{
				status = (await this.#api.getMember(memberUid)).status;
			}
			catch (e)
			{
				console.error(e);
				this.#hideProgress();

				return false;
			}

			if (status === MemberStatus.ready || status === MemberStatus.stoppableReady)
			{
				pending = false;
			}
		}
		while (pending);

		if (openSigningSliderAfterPending)
		{
			await this.#openSigningSliderAndCloseCurrent(signLink);
		}

		return true;
	}

	async #openSigningSliderAndCloseCurrent(signLink: SignLink): Promise<void>
	{
		return this.#cache.remember('openSigningSliderAndCloseCurrent', async () => {
			const currentSidePanel = BX.SidePanel.Instance.getTopSlider();
			// load signing data before close current slider
			await signLink.preloadData();
			if (Type.isNull(currentSidePanel))
			{
				signLink.openSlider({ events: {} });
			}
			else
			{
				currentSidePanel.close(false, () => signLink.openSlider({ events: {} }));
			}
		});
	}

	#getFieldsLayout(): HTMLElement[]
	{
		return this.#options.fields
			.map((field) => this.#getOrCreateFieldLayout(field))
		;
	}

	#getOrCreateFieldLayout(field: TemplateField): HTMLElement
	{
		return this.#layoutCache.remember(`fieldLayout.${field.uid}`, () => {
			const fieldsLayoutCallbackByType = this.#getFieldLayoutCallback(field);

			if (Type.isNull(fieldsLayoutCallbackByType))
			{
				throw new TypeError(`Unknown field type: ${field.type}`);
			}

			return fieldsLayoutCallbackByType(field);
		});
	}

	#getFieldLabel(name: string, required: boolean): string
	{
		return `
			<span>
				${Text.encode(name)}
				${required ? this.#getRequiredMarker() : ''}
			</span>
		`;
	}

	// no test anchor here: the marker is decorative (aria-hidden) and repeats on every required field,
	// so a shared testid would break getByTestId; a test reads aria-required on the input instead
	#getRequiredMarker(): string
	{
		return `
			<span class="sign-b2e-submit-document-info__field_required" aria-hidden="true">*</span>
		`;
	}

	#getFieldLayoutCallback(field: TemplateField): () => HTMLElement
	{
		const label = this.#getFieldLabel(field.name, field.required);

		const fieldsLayoutCallbackByType = {
			date: () => {
				const datePickerField = new DatePickerField({
					label,
					inputName: field.uid,
					value: field.value,
				});
				this.#registerUiField(datePickerField, field.required);

				return Tag.render`
					<div class="sign-b2e-submit-document-info__field">
						${datePickerField.render()}
					</div>
				`;
			},
			string: () => {
				const fieldInput = new TextInput({
					label,
					inputName: field.uid,
					value: field.value,
				});
				this.#registerUiField(fieldInput, field.required);

				return Tag.render`
					<div class="sign-b2e-submit-document-info__field">
						${fieldInput.render()}
					</div>
				`;
			},
			list: () => {
				const selector = new Selector({
					label,
					name: field.uid,
					inputName: field.uid,
					items: this.#getSelectorItemsWithEmpty(field),
				});

				this.#registerUiField(selector, field.required);

				return Tag.render`
					<div class="sign-b2e-submit-document-info__field">
						${selector.render()}
					</div>
				`;
			},
			// @TODO address picker
			address: () => Tag.render`
				<div class="sign-b2e-submit-document-info__field">
					<span class="sign-b2e-submit-document-info__label">
						${Text.encode(field.name)}
					</span>
					<div class="sign-b2e-submit-document-info__subfields">
						${field.subfields.map((subfield) => Tag.render`
							<div>${this.#getOrCreateFieldLayout(subfield)}</div>
						`)}
					</div>
				</div>
			`,
		};

		const defaultLayout = () => Tag.render`<div></div>`;

		return fieldsLayoutCallbackByType[field.type] ?? defaultLayout;
	}

	#registerUiField(uiField: BaseField, required: boolean): void
	{
		this.#uiFields.push(uiField);
		if (required)
		{
			this.#markFieldRequired(uiField);
		}
	}

	// aria-required instead of the native attribute: the date input is readonly (native required does not work there)
	// and the form is sent from JS, so native validation must not start on the text inputs either
	#markFieldRequired(uiField: BaseField): void
	{
		Dom.attr(uiField.getInputNode(), 'aria-required', 'true');
	}

	#getFieldValues(): FieldValue[]
	{
		const form = document.getElementById(this.#fieldFormId);
		const formData = new FormData(form);

		const fieldValues = [];

		formData.forEach((value, name) => {
			fieldValues.push({ name, value });
		});

		return fieldValues;
	}

	#isFieldsValid(): boolean
	{
		const invalidFields: BaseField[] = [];

		// regional fields are rendered above the template ones, so the fields are collected in visual order
		this.#getRenderedRegionalFields().forEach(({ field, errorMessage }: RequiredRegionalField) => {
			this.#cleanFieldError(field);
			if (field.getValue()?.trim() === '')
			{
				this.#setFieldError(field, errorMessage);
				invalidFields.push(field);
			}
		});

		this.#uiFields.forEach((domField: BaseField) => {
			this.#cleanFieldError(domField);
			const templateField = this.#getFieldByUid(domField.getName());
			if (!templateField)
			{
				return;
			}

			if (templateField.required && domField.getValue()?.trim() === '')
			{
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
	#getRenderedRegionalFields(): RequiredRegionalField[]
	{
		const fields: RequiredRegionalField[] = [];

		if (this.#externalIdField !== null)
		{
			fields.push({
				field: this.#externalIdField,
				errorMessage: Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_REG_NUMBER_REQUIRED_ERROR'),
				serverErrorCodes: [ServerErrorCode.externalIdRequired],
			});
		}

		if (this.#externalDateField !== null)
		{
			fields.push({
				field: this.#externalDateField,
				errorMessage: Loc.getMessage('SIGN_SUBMIT_DOCUMENT_INFO_DATE_CREATE_REQUIRED_ERROR'),
				serverErrorCodes: [ServerErrorCode.externalDateRequired, ServerErrorCode.externalDateInvalid],
			});
		}

		return fields;
	}

	// role is set on the empty container upfront: a live region announces only the changes
	// that happen after it is already in the DOM
	#prepareErrorContainer(uiField: BaseField, testId: string): void
	{
		Dom.attr(uiField.renderErrors(), {
			id: this.#getErrorContainerId(uiField),
			role: 'alert',
			'data-testid': `${testId}-error`,
		});
	}

	#getErrorContainerId(uiField: BaseField): string
	{
		return `${uiField.getId()}-error`;
	}

	// Template fields are marked invalid without a message, so they are described by nothing:
	// only regional fields have an error container prepared with the id to point at
	#setFieldError(uiField: BaseField, errorMessage: ?string = null): void
	{
		const hasMessage = errorMessage !== null;
		uiField.setErrors(hasMessage ? [errorMessage] : []);
		Dom.addClass(uiField.getErrorBox(), '--error');
		Dom.attr(uiField.getInputNode(), {
			'aria-invalid': 'true',
			'aria-describedby': hasMessage ? this.#getErrorContainerId(uiField) : null,
		});
	}

	#cleanFieldError(uiField: BaseField): void
	{
		uiField.cleanError();
		Dom.attr(uiField.getInputNode(), { 'aria-invalid': null, 'aria-describedby': null });
	}

	// sign.v2.api already notifies with the server message, so here it is only bound to the field it belongs
	// to. An error with no rendered field behind it (an outdated form, for example) stays in the
	// notification alone.
	#showServerErrorsOnFields(error: Object): void
	{
		const regionalFields = this.#getRenderedRegionalFields();
		const failedFields: RequiredRegionalField[] = [];

		this.#getServerErrors(error).forEach(({ code, message }: ServerError) => {
			const failedField = regionalFields.find(
				(regionalField: RequiredRegionalField) => this.#matchesServerError(regionalField, code, message),
			);
			if (failedField && !failedFields.includes(failedField))
			{
				this.#setFieldError(failedField.field, message);
				failedFields.push(failedField);
			}
		});

		failedFields[0]?.field.getInputNode().focus();
	}

	// The code is the reliable signal; the message is compared only when the error came without a code,
	// which happens when sign.v2.api rethrows a plain Error built from the first message
	#matchesServerError(regionalField: RequiredRegionalField, code: string, message: string): boolean
	{
		if (Type.isStringFilled(code))
		{
			return regionalField.serverErrorCodes.includes(code);
		}

		return message === regionalField.errorMessage;
	}

	#getServerErrors(error: Object): ServerError[]
	{
		if (Type.isArrayFilled(error?.errors))
		{
			return error.errors.map(({ code, message }) => ({ code: code ?? '', message }));
		}

		return Type.isStringFilled(error?.message) ? [{ code: '', message: error.message }] : [];
	}

	#getFieldByUid(uid: string): ?TemplateField
	{
		return this.#findFieldByUidRecursive(uid, this.#options.fields);
	}

	#findFieldByUidRecursive(uid: string, fields: TemplateField[]): ?TemplateField
	{
		for (const field of fields)
		{
			if (field.uid === uid)
			{
				return field;
			}

			if (field.subfields)
			{
				const subfield = this.#findFieldByUidRecursive(uid, field.subfields);
				if (subfield)
				{
					return subfield;
				}
			}
		}

		return null;
	}

	#getSelectorItemsWithEmpty(field: TemplateField): Array<{ value: string, name: string, selected: boolean }>
	{
		const items = [];
		const fieldItems = Type.isArray(field.items) ? field.items : [];

		if (!fieldItems.some((item) => item.code === field.value))
		{
			items.push({
				value: '',
				name: '',
				selected: true,
				hidden: true,
				disabled: true,
			});
		}

		fieldItems.forEach((item) => {
			items.push({
				value: Text.encode(item.code),
				name: Text.encode(item.label),
				selected: item.code === field.value,
			});
		});

		return items;
	}
}
