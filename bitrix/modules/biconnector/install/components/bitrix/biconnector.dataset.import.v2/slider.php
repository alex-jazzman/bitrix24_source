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
$sourceId = (string)($request->get('sourceId') ?? 0);

$wrapperParams = [
	'POPUP_COMPONENT_NAME' => 'bitrix:biconnector.dataset.import.v2',
	'POPUP_COMPONENT_TEMPLATE_NAME' => '',
	'POPUP_COMPONENT_PARAMS' => [
		'sourceId' => $sourceId,
		'datasetId' => (int)($request->get('datasetId') ?? 0),
		'connection' => is_array($request->get('connection')) ? $request->get('connection') : [],
		'sectionsConfig' => is_array($request->get('sectionsConfig')) ? $request->get('sectionsConfig') : [],
	],

	'CLOSE_AFTER_SAVE' => false,
	'RELOAD_GRID_AFTER_SAVE' => true,
	'ENABLE_MODE_TOGGLE' => false,
	'USE_BACKGROUND_CONTENT' => false,
	'USE_PADDING' => false,
	'USE_UI_TOOLBAR' => 'Y',
	'IS_TOOL_PANEL_ALWAYS_VISIBLE' => false,
];

$APPLICATION->IncludeComponent('bitrix:ui.sidepanel.wrapper', '', $wrapperParams);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
