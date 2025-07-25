<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-paddings pagetitle-toolbar-field-view flexible-layout crm-pagetitle-view crm-toolbar');

\Bitrix\Main\UI\Extension::load('ui.fonts.opensans');

$APPLICATION->IncludeComponent(
	'bitrix:crm.control_panel',
	'',
	[
		'ID' => 'RECYCLE_BIN',
		'ACTIVE_ITEM_ID' => 'RECYCLE_BIN',
		'PATH_TO_COMPANY_LIST' => $arParams['PATH_TO_COMPANY_LIST'] ?? '',
		'PATH_TO_COMPANY_EDIT' => $arParams['PATH_TO_COMPANY_EDIT'] ?? '',
		'PATH_TO_CONTACT_LIST' => $arParams['PATH_TO_CONTACT_LIST'] ?? '',
		'PATH_TO_CONTACT_EDIT' => $arParams['PATH_TO_CONTACT_EDIT'] ?? '',
		'PATH_TO_DEAL_LIST' => $arParams['PATH_TO_DEAL_LIST'] ?? '',
		'PATH_TO_DEAL_CATEGORY' => $arParams['PATH_TO_DEAL_CATEGORY'] ?? '',
		'PATH_TO_DEAL_EDIT' => $arParams['PATH_TO_DEAL_EDIT'] ?? '',
		'PATH_TO_LEAD_LIST' => $arParams['PATH_TO_LEAD_LIST'] ?? '',
		'PATH_TO_LEAD_EDIT' => $arParams['PATH_TO_LEAD_EDIT'] ?? '',
		'PATH_TO_QUOTE_LIST' => $arResult['PATH_TO_QUOTE_LIST'] ?? '',
		'PATH_TO_QUOTE_EDIT' => $arResult['PATH_TO_QUOTE_EDIT'] ?? '',
		'PATH_TO_INVOICE_LIST' => $arResult['PATH_TO_INVOICE_LIST'] ?? '',
		'PATH_TO_INVOICE_EDIT' => $arResult['PATH_TO_INVOICE_EDIT'] ?? '',
		'PATH_TO_REPORT_LIST' => $arParams['PATH_TO_REPORT_LIST'] ?? '',
		'PATH_TO_DEAL_FUNNEL' => $arParams['PATH_TO_DEAL_FUNNEL'] ?? '',
		'PATH_TO_EVENT_LIST' => $arParams['PATH_TO_EVENT_LIST'] ?? '',
		'PATH_TO_PRODUCT_LIST' => $arParams['PATH_TO_PRODUCT_LIST'] ?? '',
		'PATH_TO_RECYCLE_BIN' => $arParams['PATH_TO_RECYCLE_BIN'] ?? '',
	],
	$component
);

$this->SetViewTarget('below_pagetitle');
?>
	<div class="crm-recyclebin-list-toolbar">
		<div class="crm-recyclebin-list-config">
			<div class="crm-recyclebin-list-info">
				<span class="crm-recyclebin-list-info-text"><?= Loc::getMessage('CRM_RECYCLE_LIST_TTL_NOTICE', ['#TTL_DAY#' => $arResult['TTL']]) ?></span>
			</div>
		</div>
	</div>
<?php
$this->EndViewTarget();

 $APPLICATION->IncludeComponent(
	'bitrix:recyclebin.list',
	'.default',
	[
		'MODULE_ID' => 'crm',
		'GRID_ID' => $arResult['GRID_ID'],
		'ENTITY_TYPE' => $arResult['RECYCLABLE_ENTITY_TYPE'],
		'USER_ID' => $arResult['USER_ID'],
		'PATH_TO_USER_PROFILE' => $arResult['PATH_TO_USER_PROFILE'],
		'FILTER_PRESETS' => $arResult['FILTER_PRESETS'],
		'USE_FOR_ALL_CHECKBOX' => 'Y',
	],
	$component,
	[
		'HIDE_ICONS' => 'Y',
	]
);
