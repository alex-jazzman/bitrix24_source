import { Loc, Text, Type } from 'main.core';
import { wrapTextToHtmlWithWordBreak } from './helpers';

export function getMultipleActionNotificationMessage(
	actionName: string,
	promptName: ?string,
): string | HTMLElement
{
	if (!Type.isStringFilled(promptName))
	{
		return getMassActionNotificationMessage(actionName);
	}

	switch (actionName)
	{
		case 'multiple-activate':
		{
			return wrapTextToHtmlWithWordBreak(Loc.getMessage(
				'PROMPT_LIBRARY_GRID_NOTIFICATION_ACTIVATE',
				{ '#NAME#': `<b>${Text.encode(promptName)}</b>` },
			));
		}

		case 'multiple-deactivate':
		{
			return wrapTextToHtmlWithWordBreak(Loc.getMessage(
				'PROMPT_LIBRARY_GRID_NOTIFICATION_DEACTIVATE',
				{ '#NAME#': `<b>${Text.encode(promptName)}</b>` },
			));
		}

		case 'multiple-show-for-me':
		{
			return wrapTextToHtmlWithWordBreak(Loc.getMessage(
				'PROMPT_LIBRARY_GRID_NOTIFICATION_SHOW_MSGVER_1',
				{ '#NAME#': `<b>${Text.encode(promptName)}</b>` },
			));
		}

		case 'multiple-hide-from-me':
		{
			return wrapTextToHtmlWithWordBreak(Loc.getMessage(
				'PROMPT_LIBRARY_GRID_NOTIFICATION_HIDE_MSGVER_1',
				{ '#NAME#': `<b>${Text.encode(promptName)}</b>` },
			));
		}

		default:
		{
			return Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_ACTION_DEFAULT');
		}
	}
}

function getMassActionNotificationMessage(actionName: string): string
{
	switch (actionName)
	{
		case 'multiple-activate':
		{
			return Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_ACTIVATE');
		}

		case 'multiple-deactivate':
		{
			return Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_DEACTIVATE');
		}

		case 'multiple-show-for-me':
		{
			return Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_SHOW_MSGVER_1');
		}

		case 'multiple-hide-from-me':
		{
			return Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_HIDE_MSGVER_1');
		}

		default:
		{
			return Loc.getMessage('PROMPT_LIBRARY_GRID_NOTIFICATION_MASS_ACTION_DEFAULT');
		}
	}
}
