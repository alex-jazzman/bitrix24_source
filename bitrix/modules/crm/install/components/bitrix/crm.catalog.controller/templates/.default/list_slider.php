<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var \CBitrixComponentTemplate $this
 * @var \CrmCatalogControllerComponent $component
 * @global \Cmain $APPLICATION
 * @var array $arResult
 */

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:catalog.product.grid',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '.default',
		'POPUP_COMPONENT_PARAMS' => [
			'GRID_ID' => 'CrmProductGrid',
			'IBLOCK_ID' => $arResult['IBLOCK_ID'],
			'SECTION_ID' => $arResult['VARIABLES']['SECTION_ID'] ?? null,
			'URL_BUILDER' => $arResult['URL_BUILDER'],
			'USE_NEW_CARD' => $arResult['USE_NEW_CARD'],
			'LIST_MODE' => $arResult['URL_BUILDER']->getListMode(),
			'CREATE_BTN_ITEMS' => $arResult['CREATE_BTN_ITEMS'],
		],
		'USE_PADDING' => false,
		'USE_UI_TOOLBAR' => $arResult['SHOW_TOOLBAR'] ? 'Y' : 'N',
	],
	$component,
	['HIDE_ICONS' => 'Y']
);
