<?php if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();
global $APPLICATION;
$isSettingsHub = ($arParams['IS_SETTINGS_HUB'] ?? null) === true;
if ($isSettingsHub)
{
	$bpListUrl = str_replace(
		'#entity_id#',
		$arResult['VARIABLES']['entity_id'],
		$arResult['FOLDER'] . $arResult['URL_TEMPLATES']['bp_list'],
	);
}
if (($arParams['ENABLE_CONTROL_PANEL'] ?? true) !== false)
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.control_panel',
		'',
		array(
			'ID' => 'BP_EDIT',
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
}
?>
<div
	data-testid="crm-config-bp-edit-page"
	<?php if ($isSettingsHub): ?>
		data-crm-bp-hub-navigation
		data-crm-bp-hub-list-url="<?= htmlspecialcharsbx($bpListUrl) ?>"
	<?php endif ?>
>
<?php
$APPLICATION->IncludeComponent(
	'bitrix:crm.config.bp.edit',
	'',
	Array(
		'IS_SETTINGS_HUB' => $isSettingsHub,
		'BP_ENTITY_ID' => $arResult['VARIABLES']['entity_id'],
		'BP_BP_ID' => $arResult['VARIABLES']['bp_id'],
		'ENTITY_LIST_URL' => $arResult['FOLDER'].$arResult['URL_TEMPLATES']['entity_list'],
		'BP_LIST_URL' => $arResult['FOLDER'].$arResult['URL_TEMPLATES']['bp_list'],
		'BP_EDIT_URL' => $arResult['FOLDER'].$arResult['URL_TEMPLATES']['bp_edit']
	),
	$component
);
?>
</div>
