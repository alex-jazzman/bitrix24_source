<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var \CMain $APPLICATION */

$activityId = $arResult['ACTIVITY_ID'];
$isReadOnly = $arResult['IS_READ_ONLY'];

$componentParams = [
	'POPUP_COMPONENT_NAME' => 'bitrix:crm.activity.planner',
	'POPUP_COMPONENT_TEMPLATE_NAME' => '',
	'POPUP_COMPONENT_PARAMS' => [
		'ACTION' => 'VIEW',
		'ELEMENT_ID' => $activityId,
		'READ_ONLY' => $isReadOnly ? 'Y' : 'N',
		'CHECK_PERMISSIONS' => $isReadOnly ? 'N' : 'Y',
	],
	'USE_PADDING' => false,
	'PAGE_MODE' => false,
	'PAGE_MODE_OFF_BACK_URL' => '/crm/',
	'PLAIN_VIEW' => false,
	'USE_BACKGROUND_CONTENT' => false,
	'USE_UI_TOOLBAR' => 'Y',
	'HIDE_TOOLBAR' => true,
];

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	$componentParams,
);
