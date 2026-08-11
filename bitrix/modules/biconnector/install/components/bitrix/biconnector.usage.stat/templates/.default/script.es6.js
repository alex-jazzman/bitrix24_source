import { ajax as Ajax, Reflection, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';

/**
 * @namespace BX.BIConnector
 */
class UsageStatGridManager
{
	#gridId: string;

	constructor(props)
	{
		this.#gridId = props.gridId;
		this.#initHints();
		EventEmitter.subscribe('Grid::updated', () => this.#initHints());
	}

	#getGrid(): ?BX.Main.grid
	{
		const manager = BX.Main.gridManager.getById(this.#gridId);

		return manager ? manager.instance : null;
	}

	#initHints(): void
	{
		const grid = this.#getGrid();
		if (!grid)
		{
			return;
		}

		const manager = BX.UI.Hint.createInstance({
			popupParameters: {
				autoHide: true,
				offsetLeft: 10,
				offsetTop: 6,
				maxWidth: 320,
			},
		});
		manager.init(grid.getContainer());
	}

	// noinspection JSUnusedGlobalSymbols
	openElement(entityType: string, entityId: number): void
	{
		const grid = this.#getGrid();
		grid?.tableFade();

		Ajax.runAction('biconnector.usagestat.getOpenUrl', {
			data: { entityType, entityId },
		})
			.then((response) => {
				const link = response.data;
				if (link)
				{
					window.open(link, '_blank').focus();
				}
				grid?.tableUnfade();
			})
			.catch((response) => {
				if (response?.errors?.[0]?.message)
				{
					BX.UI.Notification.Center.notify({
						content: Text.encode(response.errors[0].message),
					});
				}
				grid?.tableUnfade();
			});
	}
}

Reflection.namespace('BX.BIConnector').UsageStatGridManager = UsageStatGridManager;
