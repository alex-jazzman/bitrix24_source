import { Event } from 'main.core';

export class Error
{
	constructor()
	{
		Event.ready(() => {
			this.bindEvents();
		});
	}

	bindEvents()
	{
		const catalogButton = document.getElementById('market-detail-go-to-catalog');
		if (catalogButton)
		{
			Event.bind(catalogButton, 'click', this.handleCatalogClick.bind(this));
		}
	}

	handleCatalogClick()
	{
		top.location.href = '/market/?openCatalog=Y';
	}
}
