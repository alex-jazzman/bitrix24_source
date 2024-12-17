<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$arActivityDescription = [
	'NAME' => Loc::getMessage('BP_FRA_DESCR_NAME'),
	'DESCRIPTION' => Loc::getMessage('BP_FRA_DESCR_DESCR'),
	'TYPE' => ['activity'],
	'CLASS' => 'FixResultActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'other',
	],
	'RETURN' => [
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('BP_FRA_DESCR_ERROR_MESSAGE'),
			'TYPE' => 'string',
		],
	],
];

if (!(bool)\Bitrix\Main\Config\Option::get('bizproc', 'release_preview_2024'))
{
	$arActivityDescription['EXCLUDED'] = true;
}