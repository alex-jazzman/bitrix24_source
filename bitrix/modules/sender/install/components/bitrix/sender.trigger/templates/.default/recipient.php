<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

/** @var CMain $APPLICATION*/
/** @var array $arResult*/
/** @var array $arParams*/

global $APPLICATION;
$componentParameters = array(
	'CAMPAIGN_ID' => $arResult['ID'],
	'PATH_TO_LETTER_EDIT' => $arParams['PATH_TO_LETTER_EDIT'],
	'PATH_TO_ABUSES' => $arParams['PATH_TO_ABUSES'],
);
if ($_REQUEST['IFRAME'] == 'Y')
{
	$APPLICATION->IncludeComponent(
		"bitrix:ui.sidepanel.wrapper",
		"",
		array(
			'POPUP_COMPONENT_NAME' => "bitrix:sender.contact.recipient",
			"POPUP_COMPONENT_TEMPLATE_NAME" => "",
			"POPUP_COMPONENT_PARAMS" => $componentParameters,
			"BUTTON_LIST" => ['CLOSE' => ['URL' => '']],
			"USE_UI_TOOLBAR" => "Y",
			"USE_PADDING" => false,
		)
	);
}
else
{
	$APPLICATION->IncludeComponent(
		"bitrix:sender.contact.recipient",
		"",
		$componentParameters
	);

}