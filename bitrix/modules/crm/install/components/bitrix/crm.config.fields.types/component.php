<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

if (!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->isCrmAdmin())
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

$arTypes = CCrmFields::GetEntityTypes();

if (!\CCrmSaleHelper::isWithOrdersMode())
{
	unset($arTypes['ORDER']);
}

foreach($arTypes as $key => $ar)
{
	if ($key === 'CRM_INVOICE' && !\Bitrix\Crm\Settings\InvoiceSettings::getCurrent()->isOldInvoicesEnabled())
	{
		continue;
	}
	$arResult['ROWS'][$ar['ID']] = $ar;
	$arResult['ROWS'][$ar['ID']]['LINK_LIST'] = str_replace('#entity_id#', $ar['ID'], $arParams['~FIELDS_LIST_URL']);
	$arResult['ROWS'][$ar['ID']]['LINK_ADD'] = str_replace(	array('#entity_id#', '#field_id#'),	array($ar['ID'], 0), $arParams['~FIELD_EDIT_URL']);
}

$this->IncludeComponentTemplate();

$APPLICATION->AddChainItem(GetMessage('CRM_FIELDS_ENTITY_LIST'), $arResult['~ENTITY_LIST_URL'] ?? null);