<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;

Extension::load([
	'ui.design-tokens',
]);

/** @var CMain $APPLICATION */
global $APPLICATION;
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass.' ' : '') . ' repeat-sale-segment-details');

/** @var array $arResult */
$id = $arResult['segmentId'] ?? 0;

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:crm.repeat_sale.segment.details',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [
			'ID' => $id,
		],
		'USE_PADDING' => false,
		'PAGE_MODE' => false,
		'PAGE_MODE_OFF_BACK_URL' => '/crm/repeat-sale-segment/',
		'SHOW_BITRIX24_THEME' => false,
		'PLAIN_VIEW' => false,
		'USE_BACKGROUND_CONTENT' => false,
		'RELOAD_PAGE_AFTER_SAVE' => true,
		'CLOSE_AFTER_SAVE' => true,
		'USE_UI_TOOLBAR' => 'Y',
	]
);
