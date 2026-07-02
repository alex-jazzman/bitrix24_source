<?php

declare(strict_types=1);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

global $APPLICATION;

if (($_REQUEST['IFRAME'] ?? '') === 'Y' && ($_REQUEST['IFRAME_TYPE'] ?? '') === 'SIDE_SLIDER')
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:bizproc.storage.list',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => [],
			'USE_PADDING' => false,
			'USE_UI_TOOLBAR' => 'Y',
		]
	);
}
else
{
	$APPLICATION->IncludeComponent('bitrix:bizproc.storage.list', '', []);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
