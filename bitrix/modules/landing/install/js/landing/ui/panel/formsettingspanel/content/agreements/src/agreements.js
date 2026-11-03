import {Dom} from 'main.core';
import {Loc} from 'landing.loc';
import {HeaderCard} from 'landing.ui.card.headercard';
import {MessageCard} from 'landing.ui.card.messagecard';
import {FormSettingsForm} from 'landing.ui.form.formsettingsform';
import {AgreementsList} from 'landing.ui.field.agreementslist';
import {ContentWrapper} from 'landing.ui.panel.basepresetpanel';
import messageIcon from './images/message-icon.svg';

export class AgreementsContent extends ContentWrapper
{
	constructor(options)
	{
		super(options);
		this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.AgreementsContent');
		Dom.attr(this.getLayout(), 'data-testid', 'landing-agreements-content');

		const header = new HeaderCard({
			title: Loc.getMessage('LANDING_AGREEMENTS_TITLE'),
		});

		const message = new MessageCard({
			id: 'agreementsMessage',
			header: Loc.getMessage('LANDING_AGREEMENTS_MESSAGE_HEADER'),
			description: Loc.getMessage('LANDING_AGREEMENTS_MESSAGE_DESCRIPTION'),
			icon: messageIcon,
			restoreState: true,
		});

		Dom.attr(message.getLayout(), 'data-testid', 'landing-agreements-message');
		Dom.attr(message.getCloseButton(), 'data-testid', 'landing-agreements-message-close-btn');
		Dom.attr(message.getCloseLink(), 'data-testid', 'landing-agreements-message-hide-link');

		const listForm = new FormSettingsForm({
			id: 'agreementsList',
			fields: [
				new AgreementsList({
					selector: 'agreements',
					formOptions: this.options.formOptions,
					agreementsList: this.options.agreements,
					value: this.options.formOptions.data.agreements,
				}),
			],
		});

		Dom.attr(listForm.getLayout(), 'data-testid', 'landing-agreements-form');

		if (!message.isShown())
		{
			Dom.style(header.getLayout(), 'margin-bottom', '0');
			Dom.style(listForm.getLayout(), 'margin-top', '-19px');
		}

		message.subscribe('onClose', () => {
			Dom.style(header.getLayout(), 'margin-bottom', '0');
			Dom.style(listForm.getLayout(), 'margin-top', '-19px');
		});

		this.addItem(header);
		this.addItem(message);
		this.addItem(listForm);
		this.listForm = listForm;
	}

	destroy()
	{
		this.listForm.fields.forEach((field) => field.destroy());
		this.listForm.clear();
		this.items.forEach((item) => {
			item.unsubscribeAll('onChange');
			item.unsubscribeAll('onClose');
		});
		this.items.clear();
		this.unsubscribeAll('onChange');
		this.clear();
	}
}

export { AgreementsContent as Content };
