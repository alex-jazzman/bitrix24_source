import { Loc } from 'main.core';
import { RowTextInput } from './row-text-input';

export class LastNameInput extends RowTextInput
{
	constructor(dataTestId: string = 'invite-page-last-name-input')
	{
		super({
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
			ariaLabel: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_ARIA_LABEL'),
			dataTestId,
		});
	}
}
