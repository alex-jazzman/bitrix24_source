<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$arComponentDescription = [
	'NAME' => Loc::getMessage('BIZPROC_CONFIG_PERMISSIONS_COMPONENT_NAME'),
	'DESCRIPTION' => Loc::getMessage('BIZPROC_CONFIG_PERMISSIONS_COMPONENT_DESCRIPTION'),
	'SORT' => 100,
	'CACHE_PATH' => 'Y',
	'PATH' => [
		'ID' => 'bizproc',
	],
];
