<?php

use Bitrix\BIConnector;
use Bitrix\Main\Application;
use Bitrix\Main\Loader;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

global $APPLICATION;

if (
	!Loader::includeModule('biconnector')
	|| !BIConnector\Configuration\Feature::isExternalEntitiesEnabled()
	// A finished term of the extension closes the workplace of the analyst the same way an unsuitable tariff does.
	|| BIConnector\Superset\Selfhost\License\SelfHostedLicenseLock::isDashboardLocked()
)
{
	LocalRedirect('/');
}

$request = Application::getInstance()->getContext()->getRequest();

$dataFormats = $request->get('dataFormats');
if (!is_array($dataFormats))
{
	$dataFormats = [];
}

$wrapperParams = [
	'POPUP_COMPONENT_NAME' => 'bitrix:biconnector.dataset.import.v2.data-formats',
	'POPUP_COMPONENT_TEMPLATE_NAME' => '',
	'POPUP_COMPONENT_PARAMS' => [
		'dataFormats' => $dataFormats,
	],
	'CLOSE_AFTER_SAVE' => false,
	'RELOAD_GRID_AFTER_SAVE' => false,
	'IS_TOOL_PANEL_ALWAYS_VISIBLE' => true,
	'ENABLE_MODE_TOGGLE' => false,
	'USE_BACKGROUND_CONTENT' => true,
	'USE_PADDING' => false,
	'USE_UI_TOOLBAR' => 'Y',
];

$APPLICATION->IncludeComponent('bitrix:ui.sidepanel.wrapper', '', $wrapperParams);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
