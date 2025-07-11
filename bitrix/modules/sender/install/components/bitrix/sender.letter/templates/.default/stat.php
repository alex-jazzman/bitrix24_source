<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/** @var CMain $APPLICATION*/
/** @var array $arResult*/
/** @var array $arParams*/

global $APPLICATION;
$componentParameters = array(
	'CHAIN_ID' => $arResult['ID'],
	'NAME_TEMPLATE' => $arResult['NAME_TEMPLATE'] ?? '',
	'PATH_TO_USER_PROFILE' => $arResult['PATH_TO_USER_PROFILE'] ?? '',
	'PATH_TO_LIST' => $arResult['PATH_TO_LIST'] ?? '',
	'PATH_TO_ADD' => $arResult['PATH_TO_ADD'] ?? '',
	'PATH_TO_EDIT' => $arResult['PATH_TO_EDIT'] ?? '',
	'PATH_TO_STAT' => $arResult['PATH_TO_STAT'] ?? '',
	'PATH_TO_RECIPIENT' => $arResult['PATH_TO_RECIPIENT'] ?? '',
);
if (isset($_REQUEST['IFRAME']) && $_REQUEST['IFRAME'] === 'Y')
{
	$APPLICATION->IncludeComponent(
		"bitrix:ui.sidepanel.wrapper",
		"",
		array(
			'POPUP_COMPONENT_NAME' => "bitrix:sender.letter.stat",
			"POPUP_COMPONENT_TEMPLATE_NAME" => "",
			"POPUP_COMPONENT_PARAMS" => $componentParameters,
			"USE_UI_TOOLBAR" => "Y",
			"USE_PADDING" => false,
		)
	);
}
else
{
	$APPLICATION->IncludeComponent(
		"bitrix:sender.letter.stat",
		"",
		$componentParameters
	);

}