import { Loc, Tag } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Button, AirButtonStyle } from 'ui.buttons';

export function showProviderRestrictionPopup(providerName: string, onConfirm?: () => void): void
{
	const replace = { '#PROVIDER#': providerName };
	const message = (key: string): string => Loc.getMessage(key, replace) ?? '';

	const content = Tag.render`
		<div class="mail-provider-restriction-popup__content">
			<div class="mail-provider-restriction-popup__icon"></div>
			<div class="mail-provider-restriction-popup__title">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_TITLE')}</div>
			<p class="mail-provider-restriction-popup__text">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_TEXT_1')}</p>
			<p class="mail-provider-restriction-popup__text">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_TEXT_2')}</p>
			<div class="mail-provider-restriction-popup__subtitle">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_WHAT_TODO')}</div>
			<ul class="mail-provider-restriction-popup__list">
				<li>${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_STEP_1')}</li>
				<li>${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_STEP_2')}</li>
			</ul>
			<p class="mail-provider-restriction-popup__note">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_NOTE')}</p>
		</div>
	`;

	let box: { close(): void; show(): void };

	const okButton = new Button({
		text: message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_OK'),
		useAirDesign: true,
		style: AirButtonStyle.FILLED,
		onclick: () => {
			box.close();
			onConfirm?.();

			return {};
		},
	} as ConstructorParameters<typeof Button>[0]);

	box = new MessageBox({
		message: content,
		minWidth: 620,
		maxWidth: 620,
		buttons: [okButton],
		popupOptions: {
			className: 'mail-provider-restriction-popup',
		},
	});

	box.show();
}
