import { Type, Extension } from 'main.core';
import { Form } from 'ui.feedback.form';
import { string } from '../../../text-editor/test/e2e/tests/html';

export type partnerFormParams = {
	id: string | number;
	source: string;
	title?: string;
	button?: string;
};

export class PartnerForm
{
	constructor(options = { name: 'PartnerForm' })
	{
		this.name = options.name;
	}

	setName(name)
	{
		if (Type.isString(name))
		{
			this.name = name;
		}
	}

	getName()
	{
		return this.name;
	}

	static show(params: partnerFormParams)
	{
		const formParams = {
			id: params.id,
			showTitle: (params.title ?? '') !== '',
			forms: Extension.getSettings('ui.feedback.partnerform').get('partnerForms'),
			portalUri: Extension.getSettings('ui.feedback.partnerform').get('partnerUri'),
			presets: { source: params.source },
			...(params.title != null ? { title: params.title } : {}),
			...(params.button != null ? { button: params.button } : {}),
		};

		Form.open(formParams);
	}
}
