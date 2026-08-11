import { Loc } from 'main.core';
import { RowTextInput } from './row-text-input';

export class NameInput extends RowTextInput
{
	constructor(dataTestId: string = 'invite-page-name-input')
	{
		super({
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
			ariaLabel: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_ARIA_LABEL'),
			dataTestId,
		});
	}
}
