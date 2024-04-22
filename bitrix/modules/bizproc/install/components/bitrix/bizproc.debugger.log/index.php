<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();

$componentParams = [
	'SET_TITLE' => $request->get('setTitle') === 'Y',
	'SESSION_ID' => $request->get('sessionId'),
];

global $APPLICATION;
if ($request->get('IFRAME') === 'Y' && $request->get('IFRAME_TYPE') === 'SIDE_SLIDER')
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:bizproc.debugger.log',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => $componentParams,
			'USE_PADDING' => false,
			'USE_BACKGROUND_CONTENT' => false,
		]
	);
}
else
{
	$APPLICATION->IncludeComponent(
		'bitrix:bizproc.debugger.log',
		'',
		$componentParams
	);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');