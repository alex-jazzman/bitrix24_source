<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$arComponentDescription = [
	'NAME' => Loc::getMessage('CRM_SETTINGS_HUB_NAME'),
	'DESCRIPTION' => Loc::getMessage('CRM_SETTINGS_HUB_DESCRIPTION'),
	'ICON' => '/images/icon.gif',
	'SORT' => 750,
	'CACHE_PATH' => 'Y',
	'PATH' => [
		'ID' => 'crm',
		'NAME' => Loc::getMessage('CRM_SETTINGS_HUB_PATH_NAME'),
		'CHILD' => [
			'ID' => 'config',
			'NAME' => Loc::getMessage('CRM_SETTINGS_HUB_PATH_CHILD_NAME'),
		],
	],
];
