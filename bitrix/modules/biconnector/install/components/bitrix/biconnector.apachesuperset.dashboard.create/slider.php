<?php

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/header.php');

global $APPLICATION;

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:biconnector.apachesuperset.dashboard.create',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [
			'GROUP_IDS' => $request->get('groupIds') ?? null,
		],

		'CLOSE_AFTER_SAVE' => false,
		'RELOAD_GRID_AFTER_SAVE' => false,
		'IS_TOOL_PANEL_ALWAYS_VISIBLE' => true,
		'ENABLE_MODE_TOGGLE' => false,

		'USE_BACKGROUND_CONTENT' => true,
		'USE_PADDING' => false,
		'USE_UI_TOOLBAR' => 'Y',
	],
);

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/footer.php');
