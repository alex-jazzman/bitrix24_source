<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var $arResult array
 */

global $APPLICATION;
$APPLICATION->SetTitle($arResult['TITLE']);

$APPLICATION->IncludeComponent(
	'bitrix:crm.deal.list',
	'',
	[
		'INTERNAL_FILTER' => $arResult['FILTER'],
		'USE_ALL_HEADER_SECTIONS' => true,
		'ENABLE_TOOLBAR' => false,
		'GRID_ID_SUFFIX' => 'REPEAT_SALE',
		'EXCLUDE_MENU_ITEMS' => ['EXCLUDE'],
	]
);