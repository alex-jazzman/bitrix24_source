<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();

global $APPLICATION;
$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:biconnector.apachesuperset.dashboard.detail.info',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [
			'DASHBOARD_ID' => $request->get('dashboard_id'),
		],
		'POPUP_COMPONENT_USE_BITRIX24_THEME' => 'Y',
		'IS_TOOL_PANEL_ALWAYS_VISIBLE' => true,
		'USE_PADDING' => false,
		'PLAIN_VIEW' => false,
	]
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');