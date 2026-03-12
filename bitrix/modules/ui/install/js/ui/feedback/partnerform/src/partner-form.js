import { ajax, Extension, Type } from 'main.core';
import { Form } from 'ui.feedback.form';
import PartnerFormType from './partner-form-type';

export type partnerFormParams = {
	id: string | number;
	source: string;
	title?: string;
	showTitle?: boolean;
	button?: string;
	node?: HTMLElement;
	presets?: Object,
};

export class PartnerForm
{
	static show(params: partnerFormParams)
	{
		const formParams = this.initParams(params, PartnerFormType.ORDER);
		Form.open(formParams);
	}

	static showFeedback(params: partnerFormParams): void
	{
		const formParams = this.initParams(params, PartnerFormType.FEEDBACK);
		Form.open(formParams);
	}

	static showRefusal(params: partnerFormParams): void
	{
		const formParams = this.initParams(params, PartnerFormType.REFUSAL);
		Form.open(formParams);
	}

	static showRefusalFromCheckout(params: partnerFormParams): void
	{
		const formParams = this.initParams(params, PartnerFormType.REFUSAL_CHECKOUT);
		Form.open(formParams);
	}

	static renderInline(params: partnerFormParams): Promise<Form>
	{
		const requestParams = this.initParams(params);
		const { node, ...requestData } = requestParams;

		return ajax.runAction('ui.feedback.loadData', { json: requestData }).then((response) => {
			const data = response.data && response.data.params ? response.data.params : {};

			const formParams = {
				...requestParams,
				id: data.id,
				form: data.form,
				portal: data.portal,
				presets: data.presets,
			};

			if (!Type.isStringFilled(formParams.title))
			{
				formParams.title = data.title;
			}

			return new Form(formParams);
		});
	}

	static initParams(params: partnerFormParams, type: PartnerFormType = PartnerFormType.ORDER): partnerFormParams
	{
		const formParams = {
			id: params.id,
			forms: this.getFormsByType(type),
			portalUri: Extension.getSettings('ui.feedback.partnerform').get('partnerUri'),
			presets: {
				...Extension.getSettings('ui.feedback.partnerform').get('partnerFeedbackPresets'),
				...(Type.isNil(params.presets) ? { source: params.source } : params.presets),
			},
			showTitle: params.showTitle === true,
		};

		if (Type.isStringFilled(params.title))
		{
			formParams.title = params.title;
			formParams.showTitle = true;
		}

		if (Type.isStringFilled(params.button))
		{
			formParams.button = params.button;
		}

		if (!Type.isNil(params.node))
		{
			formParams.node = params.node;
		}

		return formParams;
	}

	static getFormsByType(type: PartnerFormType)
	{
		switch (type)
		{
			case PartnerFormType.FEEDBACK:
				return Extension.getSettings('ui.feedback.partnerform').get('partnerFeedbackForms');
			case PartnerFormType.REFUSAL:
				return Extension.getSettings('ui.feedback.partnerform').get('partnerRefusalForms');
			case PartnerFormType.REFUSAL_CHECKOUT:
				return Extension.getSettings('ui.feedback.partnerform').get('partnerRefusalCheckoutForms');
			case PartnerFormType.ORDER:
			default:
				return Extension.getSettings('ui.feedback.partnerform').get('partnerForms');
		}
	}
}
