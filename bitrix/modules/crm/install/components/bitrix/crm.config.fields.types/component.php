<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Service\UserPermissions\ConfigurationCallSite;
use Bitrix\Crm\Service\UserPermissions\ConfigurationScope;

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

$configuration = \Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->configuration();
// The section lists the entity types of CRM without naming one, so it asks about CRM itself. It keeps
// the call site of the fields list: the former check of this file was the same global one, and reading
// the section serves both operations - either right opens it, and only the add link below is the one
// operation that creates a field.
$configurationScope = ConfigurationScope::ofCrm();
$canManageFields = $configuration->canManageFields(ConfigurationCallSite::FieldsListComponent, $configurationScope);
$canDeleteFields = $configuration->canDeleteFields(ConfigurationCallSite::FieldsListComponent, $configurationScope);
if (!$canManageFields && !$canDeleteFields)
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

$arResult['CAN_MANAGE_FIELDS'] = $canManageFields;

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