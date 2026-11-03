<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\UserPermissions\ConfigurationCallSite;
use Bitrix\Crm\Service\UserPermissions\ConfigurationScope;
use Bitrix\UI\Buttons\AddButton;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\JsCode;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

global $USER, $APPLICATION;
$curPageUrl = $APPLICATION->GetCurPage();
$arParams['PATH_TO_DEAL_CATEGORY_LIST'] = CrmCheckPath('PATH_TO_DEAL_CATEGORY_LIST', $arParams['PATH_TO_DEAL_CATEGORY_LIST'], $curPageUrl);
$arParams['TYPE'] = 'list';

if (!Container::getInstance()->getUserPermissions()->configuration()->canManageFunnels(
	ConfigurationCallSite::DealCategoryListAjax,
	ConfigurationScope::ofEntityType(CCrmOwnerType::Deal),
))
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

$button = new AddButton([
	'text' => GetMessage('CRM_DEAL_CATEGORY_ADD'),
	'title' => GetMessage('CRM_DEAL_CATEGORY_ADD_TITLE'),
	'color' => Color::SUCCESS,
	'onclick' => new JsCode(
		"BX.onCustomEvent(window, 'CrmDealCategoryCreate', [this.getContainer()]); "
		. 'BX.PreventDefault(this.getContainer());',
	),
	'dataset' => [
		'testid' => 'crm-deal-category-add-button',
	],
]);

Toolbar::addButton($button, ButtonLocation::AFTER_TITLE);
?>
