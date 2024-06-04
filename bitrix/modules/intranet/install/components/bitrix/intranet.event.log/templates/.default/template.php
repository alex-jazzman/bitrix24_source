<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\UI\Toolbar\Facade\Toolbar;

/**
 * @var array $arParams
 * @var array $arResult
 * @var \CMain $APPLICATION
 */

Toolbar::addFilter([
	'GRID_ID' => $arResult['GRID_ID'],
	'FILTER_ID' => $arResult['FILTER_ID'],
	'FILTER' => $arResult['FILTER'],
	'DISABLE_SEARCH' => true,
	'ENABLE_LABEL' => true,
]);

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	[
		'GRID_ID' => $arResult['GRID_ID'],
		'COLUMNS' => $arResult['GRID_COLUMNS'],
		'ROWS' => $arResult['GRID_ROWS'],
		'NAV_OBJECT' => $arResult['NAV_OBJECT'],
		'ACTION_ALL_ROWS' => false,
		'AJAX_OPTION_HISTORY' => 'N',
		'AJAX_MODE' => 'Y',
		'SHOW_ROW_CHECKBOXES' => false,
		'SHOW_SELECTED_COUNTER' => false,
		'EDITABLE' => false,
	]
);
