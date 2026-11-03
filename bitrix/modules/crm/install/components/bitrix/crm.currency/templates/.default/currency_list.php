<?if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
global $APPLICATION;
$isIframe = \Bitrix\Main\Context::getCurrent()->getRequest()->get('IFRAME') === 'Y';

$listComponentParams = [
	'PATH_TO_CURRENCY_LIST' => $arResult['PATH_TO_CURRENCY_LIST'] ?? null,
	'PATH_TO_CURRENCY_SHOW' => $arResult['PATH_TO_CURRENCY_SHOW'] ?? null,
	'PATH_TO_CURRENCY_ADD' => $arResult['PATH_TO_CURRENCY_ADD'] ?? null,
	'PATH_TO_CURRENCY_EDIT' => $arResult['PATH_TO_CURRENCY_EDIT'] ?? null,
];

if ($isIframe)
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:crm.currency.list',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => $listComponentParams,
			'USE_UI_TOOLBAR' => 'Y',
		],
		$component,
	);
}
else
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.currency.list',
		'',
		$listComponentParams,
		$component
	);
}
