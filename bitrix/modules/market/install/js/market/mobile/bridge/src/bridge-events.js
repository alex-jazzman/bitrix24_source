export class BridgeEvents
{
	static get PAGE_READY(): string
	{
		return 'market:page:ready';
	}

	static get TOOLBAR_UPDATE(): string
	{
		return 'market:toolbar:update';
	}

	static get INSTALL_COMPLETE(): string
	{
		return 'market:install:complete';
	}

	static get NAVIGATION_BACK(): string
	{
		return 'market:navigation:back';
	}

	static get MENU_CLICK(): string
	{
		return 'market:menu:click';
	}
}
