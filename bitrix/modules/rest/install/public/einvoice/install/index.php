<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');


$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:rest.einvoice.installer',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [],
		'USE_PADDING' => false,
		'PLAIN_VIEW' => true,
		'PAGE_MODE' => false,
		'USE_BACKGROUND_CONTENT' => true,
	]
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
