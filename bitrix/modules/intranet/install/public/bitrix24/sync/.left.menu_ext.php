<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Call\Integration\Intranet\SyncPageRouter;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Intranet\Integration\Templates\Air\ChatMenu;
use Bitrix\Intranet\Integration\Templates\Air\CollaborationWebMenu;

Loc::loadMessages($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/intranet/public_bitrix24/.superleft.menu_ext.php');

$aMenuLinks = [];

if (Loader::includeModule('call'))
{
	$isCollaborationMenu = CollaborationWebMenu::getMenuId('collaboration') !== null;
	$topMenuSectionDir = $isCollaborationMenu
		? SITE_DIR . 'collaboration/'
		: SITE_DIR . 'sync/'
	;
	$GLOBALS['APPLICATION']->setPageProperty('topMenuSectionDir', $topMenuSectionDir);

	$aMenuLinks = [
		[
			Loc::getMessage('MENU_SYNC'),
			'/sync/',
			[],
			[
				'menu_item_id' => 'menu_sync',
			],
			'',
		],
	];

	// The call module may predate the router: then the section keeps only its own tab
	if (class_exists(SyncPageRouter::class) && SyncPageRouter::isCallsPageAvailable())
	{
		$aMenuLinks[] = [
			Loc::getMessage('MENU_SYNC_CALLS'),
			SyncPageRouter::CALLS_PATH,
			[],
			[
				'menu_item_id' => 'menu_sync_calls',
			],
			'',
		];
	}

	// The collaboration menu offers telephony in its own Sync submenu
	$call = $isCollaborationMenu ? null : ChatMenu::getMenuItemById('call');
	if ($call !== null)
	{
		$aMenuLinks[] = [
			$call['TEXT'],
			'',
			[],
			[
				'menu_item_id' => 'menu_sync_telephony',
				'onclick' => $call['ON_CLICK'],
			],
			'',
		];
	}
}
