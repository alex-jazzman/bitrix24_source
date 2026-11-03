import type { ImModelCommand } from 'im.v2.model';

// Client-side command filters, evaluated over reactive props in SlashCommandPopupContent.
export function getFilteredCommands(
	allCommands: ImModelCommand[],
	query: string,
	isExtranetUser: boolean,
): ImModelCommand[]
{
	let items = allCommands;

	if (isExtranetUser)
	{
		items = items.filter((command) => command.extranet === 'Y');
	}

	const prefix = query.trim().toLowerCase();
	if (prefix.length > 0)
	{
		items = items.filter((command) => command.command.toLowerCase().startsWith(`/${prefix}`));
	}

	return items;
}
