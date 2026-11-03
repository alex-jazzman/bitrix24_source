<?php

use Bitrix\Main\Context;

define('BX_COMPOSITE_SKIP', true);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

Context::getCurrent()->getResponse()->addHeader('Cache-Control', 'no-store, private');

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:crm.mail_template.editor',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => ['CACHE_TYPE' => 'N'],
		'IFRAME_MODE' => true,
		'PLAIN_VIEW' => true,
		'HIDE_TOOLBAR' => true,
		'USE_UI_TOOLBAR' => 'N',
		'USE_PADDING' => false,
		'PREVENT_LOADING_WITHOUT_IFRAME' => false,
	],
);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
