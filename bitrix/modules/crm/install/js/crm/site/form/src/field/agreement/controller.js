import * as BaseField from '../base/controller';
import * as Component from './component';

type OptionsContent = {
	title: string;
	text: ?string;
	url: ?string;
	html: ?string;
};

type Options = {
	id: ?string;
	name: ?string;
	label: ?string;
	required: ?Boolean;
	value: ?string;
	checked: ?Boolean;
	acceptBySubmit: ?Boolean;
	acceptBySubmitAllowed: ?Boolean;
	isPersonalDataAgreement: ?Boolean;
	agreementNoticeAllowed: ?Boolean;
	agreementNoticeEnabled: ?Boolean;
	agreementNoticeText: ?string;
	revision: ?string;
	content: string|OptionsContent;
};

class Controller extends BaseField.Controller
{
	consentRequested: Boolean = false;
	agreementNoticeVisible: Boolean = false;
	agreementNoticeAcknowledged: Boolean = false;
	agreementNoticeTimer: ?number = null;
	agreementNoticePolicy: string = '';

	static type(): string
	{
		return 'agreement';
	}

	static component()
	{
		return Component.FieldAgreement;
	}

	constructor(options: Options)
	{
		if (options.acceptBySubmit === true)
		{
			options.checked = true;
			options.required = true;
		}

		options.type = 'agreement';
		options.visible = true;
		options.multiple = false;
		options.items = null;
		options.values = null;
		super(options);
	}

	isLink()
	{
		return !!this.options.content.url;
	}

	applyConsent()
	{
		this.consentRequested = false;
		this.item().selected = true;
		this.resetAgreementNotice();
	}

	rejectConsent()
	{
		this.consentRequested = false;
		this.item().selected = false;
		this.resetAgreementNotice();
	}

	isAcceptedBySubmit()
	{
		return this.options.acceptBySubmit === true;
	}

	resetAgreementNotice()
	{
		clearTimeout(this.agreementNoticeTimer);
		this.agreementNoticeTimer = null;
		this.agreementNoticeVisible = false;
		this.agreementNoticeAcknowledged = false;
	}

	getAgreementNoticeText(): string
	{
		return String(this.options.agreementNoticeText || '').trim()
			|| this.messages.get('agreementNoticeDefault');
	}

	getAgreementNoticePolicy(): string
	{
		const options = this.options;

		return JSON.stringify([
			options.id, options.revision, options.content,
			options.agreementNoticeAllowed, options.agreementNoticeEnabled, options.agreementNoticeText,
			options.isPersonalDataAgreement, options.acceptBySubmit, this.required,
		]);
	}

	refreshAgreementNoticePolicy()
	{
		const policy = this.getAgreementNoticePolicy();
		if (policy !== this.agreementNoticePolicy)
		{
			this.resetAgreementNotice();
			this.agreementNoticePolicy = policy;
		}
	}

	requestAgreementNotice(): boolean
	{
		this.refreshAgreementNoticePolicy();

		if (
			this.options.agreementNoticeAllowed !== true
			|| this.options.agreementNoticeEnabled !== true
			|| this.options.isPersonalDataAgreement === true
			|| this.required
			|| this.isAcceptedBySubmit()
			|| this.item().selected
			|| this.agreementNoticeAcknowledged
		)
		{
			return false;
		}

		this.agreementNoticeAcknowledged = true;
		this.agreementNoticeVisible = true;
		this.agreementNoticeTimer = setTimeout(() => {
			this.agreementNoticeVisible = false;
			this.agreementNoticeTimer = null;
		}, 3000);

		return true;
	}

	requestConsent()
	{
		if (this.isAcceptedBySubmit())
		{
			return true;
		}

		this.consentRequested = false;
		if (!this.required || this.valid())
		{
			return true;
		}

		if (!this.isLink())
		{
			this.consentRequested = true;
		}

		return false;
	}
}

export {Controller}
export type {Options}
