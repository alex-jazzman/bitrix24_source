BX.namespace('BX.Catalog.Store');

class Grid
{
	static gridId;
	static tariff;

	static init(settings)
	{
		Grid.gridId = settings.gridId;
		Grid.tariff = settings.tariff;
	}

	static openStoreCreation(event)
	{
		Grid.openStoreSlider();
	}

	static openStoreSlider(id = 0)
	{
		const url = `/shop/documents-stores/details/${parseInt(id, 10)}/`;

		BX.SidePanel.Instance.open(
			url,
			{
				allowChangeHistory: true,
				cacheable: false,
				width: 500,
				events: {
					onClose(event)
					{
						if (!BX.Main.gridManager)
						{
							return;
						}

						const grid = BX.Main.gridManager.getInstanceById(Grid.gridId);
						if (grid)
						{
							grid.reload();
						}
					},
				},
			},
		);
	}

	static openTariffHelp()
	{
		if (Grid.tariff !== '')
		{
			BX.UI.InfoHelper.show(Grid.tariff);
		}
	}

	static openUfSilder(e, item)
	{
		e.preventDefault();

		BX.SidePanel.Instance.open(
			item.options.href,
			{
				allowChangeHistory: false,
				cacheable: false,
			},
		);
	}
}

BX.Catalog.Store.Grid = Grid;
