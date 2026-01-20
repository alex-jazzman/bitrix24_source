<?php

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/header.php');

global $APPLICATION;

$cmpName = 'bitrix:' . basename(__DIR__);

if ($_REQUEST['IFRAME'] === 'Y' && $_REQUEST['IFRAME_TYPE'] === 'SIDE_SLIDER')
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		array(
			'POPUP_COMPONENT_NAME' => $cmpName,
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => [
				'USER_ID' => (int)\Bitrix\Main\Context::getCurrent()->getRequest()->get('userId'),
			],
			"USE_UI_TOOLBAR" => "Y",
		)
	);
}
else
{
	$APPLICATION->IncludeComponent($cmpName, '', $cmpParams);
}

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/footer.php');
