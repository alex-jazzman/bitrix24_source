import { ajax } from 'main.core';

const Action = 'mail.api.message.setFavoriteState';

type Transport = {
	runAction(action: string, config: { data: Record<string, unknown> }): Promise<unknown>,
};

const transport = ajax as Transport;

/**
 * The star of one row. The same action serves the old grid, so the shape of the request stays as it
 * is: the row travels by its composite identifier and the state by a letter.
 */
export const FavoriteApi = {
	async setState(rowId: string, isFavorite: boolean): Promise<void>
	{
		await transport.runAction(Action, {
			data: { id: rowId, isFavorite: isFavorite ? 'Y' : 'N' },
		});
	},
};
