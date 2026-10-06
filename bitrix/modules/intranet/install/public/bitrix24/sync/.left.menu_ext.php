<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/intranet/public_bitrix24/.superleft.menu_ext.php');

$aMenuLinks = [];

if (Loader::includeModule('call'))
{
	$GLOBALS['APPLICATION']->setPageProperty('topMenuSectionDir', '/sync/');

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
}
