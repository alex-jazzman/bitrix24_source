<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/** @var \CMain $APPLICATION */
/** @var array $arResult */

$wrapperParams = [
	'POPUP_COMPONENT_NAME' => 'bitrix:mail.client.message.new',
	'POPUP_COMPONENT_PARAMS' => $arResult,
	'USE_PADDING' => false,
	'PLAIN_VIEW' => false,
	'PAGE_MODE' => false,
	'PAGE_MODE_OFF_BACK_URL' => '/mail/',
];

if (\Bitrix\Mail\Helper\Config\Feature::isComposeRedesignAvailable())
{
	// The redesigned form draws its own title and icon, so the wrapper toolbar is not rendered.
	$wrapperParams['POPUP_COMPONENT_TEMPLATE_NAME'] = 'compose';
	$wrapperParams['HIDE_TOOLBAR'] = true;
	$wrapperParams['PLAIN_VIEW'] = true;
}
else
{
	$wrapperParams['POPUP_COMPONENT_TEMPLATE_NAME'] = '';
	$wrapperParams['USE_UI_TOOLBAR'] = 'Y';
}

$APPLICATION->IncludeComponent('bitrix:ui.sidepanel.wrapper', '', $wrapperParams);
