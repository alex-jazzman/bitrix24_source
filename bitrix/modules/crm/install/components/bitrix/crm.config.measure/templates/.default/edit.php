<?
use Bitrix\Main\Web\Uri;

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
global $APPLICATION;
$APPLICATION->SetAdditionalCSS('/bitrix/js/crm/css/crm.css');

$measureListPath = $arResult['PATH_TO_MEASURE_LIST'];
if ($arResult['IS_SIDE_PANEL'])
{
	$measureListPath = (string)(new Uri($measureListPath))->addParams(array(
		'IFRAME' => 'Y',
		'IFRAME_TYPE' => 'SIDE_SLIDER',
		'SIDE_PANEL_REQUEST' => 'Y',
		'SIDE_PANEL_SAVE' => 'Y',
	));
}

$editComponentParams = array(
	'PATH_TO_MEASURE_LIST' => $measureListPath,
	'PATH_TO_MEASURE_EDIT' => $arResult['PATH_TO_MEASURE_EDIT'],
	'ELEMENT_ID' => $arResult['VARIABLES']['measure_id'],
	'IS_SIDE_PANEL' => $arResult['IS_SIDE_PANEL'],
);

if ($arResult['IS_SIDE_PANEL'])
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		array(
			'POPUP_COMPONENT_NAME' => 'bitrix:crm.config.measure.edit',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => $editComponentParams,
			'USE_UI_TOOLBAR' => 'Y',
			'USE_PADDING' => false,
		),
		$component
	);
}
else
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.control_panel',
		'',
		array(
			'ID' => 'MEASURE_EDIT',
			'ACTIVE_ITEM_ID' => '',
			'PATH_TO_COMPANY_LIST' => isset($arResult['PATH_TO_COMPANY_LIST']) ? $arResult['PATH_TO_COMPANY_LIST'] : '',
			'PATH_TO_COMPANY_EDIT' => isset($arResult['PATH_TO_COMPANY_EDIT']) ? $arResult['PATH_TO_COMPANY_EDIT'] : '',
			'PATH_TO_CONTACT_LIST' => isset($arResult['PATH_TO_CONTACT_LIST']) ? $arResult['PATH_TO_CONTACT_LIST'] : '',
			'PATH_TO_CONTACT_EDIT' => isset($arResult['PATH_TO_CONTACT_EDIT']) ? $arResult['PATH_TO_CONTACT_EDIT'] : '',
			'PATH_TO_DEAL_LIST' => isset($arResult['PATH_TO_DEAL_LIST']) ? $arResult['PATH_TO_DEAL_LIST'] : '',
			'PATH_TO_DEAL_EDIT' => isset($arResult['PATH_TO_DEAL_EDIT']) ? $arResult['PATH_TO_DEAL_EDIT'] : '',
			'PATH_TO_LEAD_LIST' => isset($arResult['PATH_TO_LEAD_LIST']) ? $arResult['PATH_TO_LEAD_LIST'] : '',
			'PATH_TO_LEAD_EDIT' => isset($arResult['PATH_TO_LEAD_EDIT']) ? $arResult['PATH_TO_LEAD_EDIT'] : '',
			'PATH_TO_QUOTE_LIST' => isset($arResult['PATH_TO_QUOTE_LIST']) ? $arResult['PATH_TO_QUOTE_LIST'] : '',
			'PATH_TO_QUOTE_EDIT' => isset($arResult['PATH_TO_QUOTE_EDIT']) ? $arResult['PATH_TO_QUOTE_EDIT'] : '',
			'PATH_TO_INVOICE_LIST' => isset($arResult['PATH_TO_INVOICE_LIST']) ? $arResult['PATH_TO_INVOICE_LIST'] : '',
			'PATH_TO_INVOICE_EDIT' => isset($arResult['PATH_TO_INVOICE_EDIT']) ? $arResult['PATH_TO_INVOICE_EDIT'] : '',
			'PATH_TO_REPORT_LIST' => isset($arResult['PATH_TO_REPORT_LIST']) ? $arResult['PATH_TO_REPORT_LIST'] : '',
			'PATH_TO_DEAL_FUNNEL' => isset($arResult['PATH_TO_DEAL_FUNNEL']) ? $arResult['PATH_TO_DEAL_FUNNEL'] : '',
			'PATH_TO_EVENT_LIST' => isset($arResult['PATH_TO_EVENT_LIST']) ? $arResult['PATH_TO_EVENT_LIST'] : '',
			'PATH_TO_PRODUCT_LIST' => isset($arResult['PATH_TO_PRODUCT_LIST']) ? $arResult['PATH_TO_PRODUCT_LIST'] : ''
		),
		$component
	);
	$APPLICATION->IncludeComponent(
		'bitrix:crm.config.measure.menu',
		'',
		array(
			'PATH_TO_MEASURE_LIST' => $arResult['PATH_TO_MEASURE_LIST'],
			'PATH_TO_MEASURE_EDIT' => $arResult['PATH_TO_MEASURE_EDIT'],
			'ELEMENT_ID' => $arResult['VARIABLES']['measure_id'],
			'TYPE' => 'edit'
		),
		$component
	);
	$APPLICATION->IncludeComponent(
		'bitrix:crm.config.measure.edit',
		'',
		$editComponentParams,
		$component
	);
}
?>
