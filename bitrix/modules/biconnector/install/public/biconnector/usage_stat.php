<?php
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';
/** @var CMain $APPLICATION */

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:biconnector.usage.stat',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [
			'KEY_EDIT_URL' => 'key_edit.php?key_id=#ID#',
		],
		'USE_UI_TOOLBAR' => 'Y',
	]
);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
