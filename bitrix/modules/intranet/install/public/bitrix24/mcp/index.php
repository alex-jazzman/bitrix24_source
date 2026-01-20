<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('aiassistant'))
{
	ShowError('Access denied');

	return null;
}

/** @var CMain $APPLICATION */

global $APPLICATION;

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:aiassistant.remote.mcp.server.list',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '.default',
		'POPUP_COMPONENT_PARAMS' => [],
		'USE_UI_TOOLBAR' => "Y",
	]
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
