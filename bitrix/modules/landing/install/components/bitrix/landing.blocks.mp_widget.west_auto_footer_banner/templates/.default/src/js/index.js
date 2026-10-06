import { Form } from 'ui.feedback.form';

export class VibeAutoWestFooter extends BX.Landing.Widget.Base
{
	constructor(element, option)
	{
		super(element);
		this.initialize(element, option);
	}

	initialize(element, option)
	{
		if (element && option)
		{
			const feedbackButtonElement = element.querySelector('#feedback-button');
			if (feedbackButtonElement)
			{
				if (option.id && option.forms && option.portal)
				{
					BX.Event.bind(feedbackButtonElement, 'click', () => this.openForm(option));
				}
			}
		}
	}

	openForm(params)
	{
		Form.open(
			{
				id: params.id,
				portalUri: params.portal,
				forms: params.forms,
				presets: params.presets,
			},
		);
	}
}
