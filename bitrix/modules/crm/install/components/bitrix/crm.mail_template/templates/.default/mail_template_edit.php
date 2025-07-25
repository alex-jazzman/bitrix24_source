<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/** @global CMain $APPLICATION */
/** @var CBitrixComponent $component */
/** @var array $arResult */

if ($_REQUEST['IFRAME'] !== 'Y')
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.control_panel',
		'',
		[
			'ID' => 'MAIL_TEMPLATE_EDIT',
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
		],
		$component
	);
}

if ($_REQUEST['IFRAME'] !== 'Y')
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.mail_template.edit',
		'',
		[
			'PATH_TO_MAIL_TEMPLATE_LIST' => $arResult['PATH_TO_MAIL_TEMPLATE_LIST'],
			'PATH_TO_MAIL_TEMPLATE_ADD' => $arResult['PATH_TO_MAIL_TEMPLATE_ADD'],
			'PATH_TO_MAIL_TEMPLATE_EDIT' => $arResult['PATH_TO_MAIL_TEMPLATE_EDIT'],
			'ELEMENT_ID' => $arResult['VARIABLES']['element_id'],
		],
		$component
	);
}
else
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:crm.mail_template.edit',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'USE_UI_TOOLBAR' => 'Y',
			'POPUP_COMPONENT_PARAMS' => [
				'PATH_TO_MAIL_TEMPLATE_LIST' => $arResult['PATH_TO_MAIL_TEMPLATE_LIST'],
				'PATH_TO_MAIL_TEMPLATE_ADD' => $arResult['PATH_TO_MAIL_TEMPLATE_ADD'],
				'PATH_TO_MAIL_TEMPLATE_EDIT' => $arResult['PATH_TO_MAIL_TEMPLATE_EDIT'],
				'ELEMENT_ID' => $arResult['VARIABLES']['element_id'],
			]
		],
		$component
	);
}
