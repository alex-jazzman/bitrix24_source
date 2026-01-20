<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

global $APPLICATION;

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
$componentParams = [
	'storageId' => $request->get('storageId')
];

if ($_REQUEST['IFRAME'] === 'Y' && $_REQUEST['IFRAME_TYPE'] === 'SIDE_SLIDER')
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:bizproc.storage.field.list',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => $componentParams,
			'USE_PADDING' => false,
			'USE_UI_TOOLBAR' => 'Y',
		]
	);
}
else
{
	$APPLICATION->IncludeComponent('bitrix:bizproc.storage.field.list', '', $componentParams);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
