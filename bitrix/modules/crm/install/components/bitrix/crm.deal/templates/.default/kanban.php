<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Integration\Analytics\Dictionary;
use Bitrix\Crm\Kanban\ViewMode;
use Bitrix\Crm\UI\NavigationBarPanel;
use Bitrix\Main\Localization\Loc;

// js/css
$APPLICATION->SetAdditionalCSS('/bitrix/themes/.default/bitrix24/crm-entity-show.css');
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass.' ' : '').'no-paddings grid-mode pagetitle-toolbar-field-view crm-toolbar');
$asset = Bitrix\Main\Page\Asset::getInstance();
$asset->addJs('/bitrix/js/crm/common.js');

Loc::loadMessages($_SERVER['DOCUMENT_ROOT'].'/bitrix/components/bitrix/crm.deal.menu/component.php');
Loc::loadMessages($_SERVER['DOCUMENT_ROOT'].'/bitrix/components/bitrix/crm.deal.list/templates/.default/template.php');

\Bitrix\Crm\Settings\Crm::markAsInitiated();

// if not isset

$canUseAllCategories = ($arResult['CAN_USE_ALL_CATEGORIES'] ?? false);
$defaultCategoryId = ($canUseAllCategories ? -1 : 0);
$categoryID = ($arResult['VARIABLES']['category_id'] ?? $defaultCategoryId);
$arResult['PATH_TO_DEAL_EDIT'] = ($arResult['PATH_TO_DEAL_EDIT'] ?? '');
$arResult['PATH_TO_DEAL_LIST'] = ($arResult['PATH_TO_DEAL_LIST'] ?? '');
$arResult['PATH_TO_DEAL_CATEGORY'] = ($arResult['PATH_TO_DEAL_CATEGORY'] ?? '');
$arResult['PATH_TO_DEAL_ACTIVITY'] = ($arResult['PATH_TO_DEAL_ACTIVITY'] ?? '');
$arResult['PATH_TO_DEAL_KANBAN'] = ($arResult['PATH_TO_DEAL_KANBAN'] ?? '');
$arResult['PATH_TO_DEAL_KANBANCATEGORY'] = ($arResult['PATH_TO_DEAL_KANBANCATEGORY'] ?? '');
$arResult['PATH_TO_DEAL_CALENDARCATEGORY'] = ($arResult['PATH_TO_DEAL_CALENDARCATEGORY'] ?? '');
$arResult['PATH_TO_DEAL_IMPORT'] = ($arResult['PATH_TO_DEAL_IMPORT'] ?? '');

// csv and excel delegate to list
$context = \Bitrix\Main\Application::getInstance()->getContext();
$request = $context->getRequest();
if (in_array($request->get('type'), array('csv', 'excel')))
{
	$curPage = $APPLICATION->getCurPageParam();
	$pathKanbanCategory = str_replace(
							'#category_id#',
							$categoryID,
							$arResult['PATH_TO_DEAL_KANBANCATEGORY']);
	$pathCategory = str_replace(
						'#category_id#',
						$categoryID,
						$arResult['PATH_TO_DEAL_CATEGORY']);
	if (mb_strpos($curPage, $pathKanbanCategory) !== false)
	{
		LocalRedirect(str_replace(
						$pathKanbanCategory,
						$pathCategory,
						$curPage
					), true);
	}
	elseif (mb_strpos($curPage, $arResult['PATH_TO_DEAL_KANBAN']) !== false)
	{
		LocalRedirect(str_replace(
						$arResult['PATH_TO_DEAL_KANBAN'],
						$arResult['PATH_TO_DEAL_LIST'],
						$curPage
					), true);
	}
}

$kanbanViewMode = $arResult['KANBAN_VIEW_MODE'] ?? null;

$subSection = $kanbanViewMode === ViewMode::MODE_ACTIVITIES ? Dictionary::SUB_SECTION_ACTIVITIES : Dictionary::SUB_SECTION_KANBAN;
$analytics = [
	'c_section' => Dictionary::SECTION_DEAL,
	'c_sub_section' => $subSection,
];

// main menu
$APPLICATION->IncludeComponent(
	'bitrix:crm.control_panel',
	'',
	array(
		'ID' => 'DEAL_LIST',
		'ACTIVE_ITEM_ID' => 'DEAL',
		'PATH_TO_COMPANY_LIST' => isset($arResult['PATH_TO_COMPANY_LIST']) ? $arResult['PATH_TO_COMPANY_LIST'] : '',
		'PATH_TO_COMPANY_EDIT' => isset($arResult['PATH_TO_COMPANY_EDIT']) ? $arResult['PATH_TO_COMPANY_EDIT'] : '',
		'PATH_TO_CONTACT_LIST' => isset($arResult['PATH_TO_CONTACT_LIST']) ? $arResult['PATH_TO_CONTACT_LIST'] : '',
		'PATH_TO_CONTACT_EDIT' => isset($arResult['PATH_TO_CONTACT_EDIT']) ? $arResult['PATH_TO_CONTACT_EDIT'] : '',
		'PATH_TO_DEAL_LIST' => isset($arResult['PATH_TO_DEAL_LIST']) ? $arResult['PATH_TO_DEAL_LIST'] : '',
		'PATH_TO_DEAL_EDIT' => isset($arResult['PATH_TO_DEAL_EDIT']) ? $arResult['PATH_TO_DEAL_EDIT'] : '',
		'PATH_TO_DEAL_CATEGORY' => isset($arResult['PATH_TO_DEAL_CATEGORY']) ? $arResult['PATH_TO_DEAL_CATEGORY'] : '',
		'PATH_TO_LEAD_LIST' => isset($arResult['PATH_TO_LEAD_LIST']) ? $arResult['PATH_TO_LEAD_LIST'] : '',
		'PATH_TO_LEAD_EDIT' => isset($arResult['PATH_TO_LEAD_EDIT']) ? $arResult['PATH_TO_LEAD_EDIT'] : '',
		'PATH_TO_QUOTE_LIST' => isset($arResult['PATH_TO_QUOTE_LIST']) ? $arResult['PATH_TO_QUOTE_LIST'] : '',
		'PATH_TO_QUOTE_EDIT' => isset($arResult['PATH_TO_QUOTE_EDIT']) ? $arResult['PATH_TO_QUOTE_EDIT'] : '',
		'PATH_TO_INVOICE_LIST' => isset($arResult['PATH_TO_INVOICE_LIST']) ? $arResult['PATH_TO_INVOICE_LIST'] : '',
		'PATH_TO_INVOICE_EDIT' => isset($arResult['PATH_TO_INVOICE_EDIT']) ? $arResult['PATH_TO_INVOICE_EDIT'] : '',
		'PATH_TO_REPORT_LIST' => isset($arResult['PATH_TO_REPORT_LIST']) ? $arResult['PATH_TO_REPORT_LIST'] : '',
		'PATH_TO_DEAL_FUNNEL' => isset($arResult['PATH_TO_DEAL_FUNNEL']) ? $arResult['PATH_TO_DEAL_FUNNEL'] : '',
		'PATH_TO_EVENT_LIST' => isset($arResult['PATH_TO_EVENT_LIST']) ? $arResult['PATH_TO_EVENT_LIST'] : '',
		'PATH_TO_PRODUCT_LIST' => isset($arResult['PATH_TO_PRODUCT_LIST']) ? $arResult['PATH_TO_PRODUCT_LIST'] : '',
		//'COUNTER_EXTRAS' => array('DEAL_CATEGORY_ID' => $categoryID),
		'ANALYTICS' => $analytics,
	),
	$component
);

// check rights
if (!\CCrmPerms::IsAccessEnabled())
{
	return false;
}

// check accessable
if (!Bitrix\Crm\Integration\Bitrix24Manager::isAccessEnabled(\CCrmOwnerType::Deal))
{
	$APPLICATION->IncludeComponent('bitrix:bitrix24.business.tools.info', '', array());
}
else
{
	$entityType = \CCrmOwnerType::DealName;

	$APPLICATION->IncludeComponent(
		'bitrix:crm.dedupe.autosearch',
		'',
		array(
			'ENTITY_TYPE_ID' => CCrmOwnerType::Company,
			'PATH_TO_MERGE' => $arResult['PATH_TO_COMPANY_MERGE'],
			'PATH_TO_DEDUPELIST' => $arResult['PATH_TO_COMPANY_DEDUPELIST']
		),
		$component,
		array('HIDE_ICONS' => 'Y')
	);

	$APPLICATION->IncludeComponent(
		'bitrix:crm.dedupe.autosearch',
		'',
		array(
			'ENTITY_TYPE_ID' => CCrmOwnerType::Contact,
			'PATH_TO_MERGE' => $arResult['PATH_TO_CONTACT_MERGE'],
			'PATH_TO_DEDUPELIST' => $arResult['PATH_TO_CONTACT_DEDUPELIST']
		),
		$component,
		array('HIDE_ICONS' => 'Y')
	);

	// menu
	$APPLICATION->IncludeComponent(
		'bitrix:crm.deal.menu',
		'',
		array(
			'PATH_TO_DEAL_LIST' => $arResult['PATH_TO_DEAL_LIST'],
			'PATH_TO_DEAL_EDIT' => $arResult['PATH_TO_DEAL_EDIT'],
			'PATH_TO_DEAL_IMPORT' => $arResult['PATH_TO_DEAL_IMPORT'],
			'PATH_TO_DEAL_RECUR' => $arResult['PATH_TO_DEAL_RECUR'],
			'PATH_TO_DEAL_RECUR_CATEGORY' => $arResult['PATH_TO_DEAL_RECUR_CATEGORY'],
			'ELEMENT_ID' => 0,
			'CATEGORY_ID' => $categoryID,
			'TYPE' => 'list',
			'DISABLE_EXPORT' => 'Y',
			'ANALYTICS' => $analytics,
		),
		$component
	);

	// category selector
	$userPermissions = CCrmPerms::GetCurrentUserPermissions();
	$map = array_fill_keys(CCrmDeal::GetPermittedToReadCategoryIDs($userPermissions), true);
	if ($canUseAllCategories)
	{
		$map['-1'] = true;
	}
	// first available category
	if (!array_key_exists($categoryID, $map))
	{
		$accessCID = array_shift(array_keys($map));
		LocalRedirect(CComponentEngine::MakePathFromTemplate(
			$arResult['PATH_TO_DEAL_KANBANCATEGORY'],
			array('category_id' => $accessCID)
		), true);
	}

	$APPLICATION->IncludeComponent(
		'bitrix:crm.deal_category.panel',
		'tiny',
		[
			'PATH_TO_DEAL_LIST' => ($kanbanViewMode === ViewMode::MODE_ACTIVITIES
				? $arResult['PATH_TO_DEAL_ACTIVITY'] : $arResult['PATH_TO_DEAL_KANBAN']),
			'PATH_TO_DEAL_EDIT' => $arResult['PATH_TO_DEAL_EDIT'],
			'PATH_TO_DEAL_CATEGORY' => $arResult['PATH_TO_DEAL_KANBANCATEGORY'],
			'PATH_TO_DEAL_CATEGORY_LIST' => $arResult['PATH_TO_DEAL_CATEGORY_LIST'],
			'PATH_TO_DEAL_CATEGORY_EDIT' => $arResult['PATH_TO_DEAL_CATEGORY_EDIT'],
			'ENABLE_CATEGORY_ALL' => ($kanbanViewMode === ViewMode::MODE_ACTIVITIES ? 'Y' : 'N'),
			'CATEGORY_ID' => $categoryID,
		],
		$component
	);

	\Bitrix\Crm\Kanban\Helper::setCategoryId($categoryID);

	// filter
	$activeItemId = (
		$kanbanViewMode === ViewMode::MODE_ACTIVITIES
			? NavigationBarPanel::ID_ACTIVITY
			: NavigationBarPanel::ID_KANBAN
	);
	$APPLICATION->IncludeComponent(
		'bitrix:crm.kanban.filter',
		'',
		[
			'ENTITY_TYPE' => $entityType,
			'VIEW_MODE' => $arResult['KANBAN_VIEW_MODE'] ?? null,
			'COUNTER_PANEL' => [
				'ENTITY_TYPE_NAME' => $entityType,
				'EXTRAS' => ['DEAL_CATEGORY_ID' => $categoryID],
			],
			'NAVIGATION_BAR' => (new NavigationBarPanel(CCrmOwnerType::Deal, $categoryID))
				->setItems([
					NavigationBarPanel::ID_KANBAN,
					NavigationBarPanel::ID_LIST,
					NavigationBarPanel::ID_ACTIVITY,
					NavigationBarPanel::ID_CALENDAR,
					NavigationBarPanel::ID_REPEAT_SALE,
					NavigationBarPanel::ID_AUTOMATION,
				], $activeItemId)
				->setBinding($arResult['NAVIGATION_CONTEXT_ID'])
				->get()
		],
		$component,
		['HIDE_ICONS' => true]
	);

	\Bitrix\Crm\Service\Container::getInstance()->getLocalization()->loadMessages();

	$APPLICATION->IncludeComponent(
		'bitrix:crm.kanban',
		'',
		[
			'ENTITY_TYPE' => $entityType,
			'VIEW_MODE' => $kanbanViewMode ?? ViewMode::MODE_STAGES,
			'USE_ITEM_PLANNER' => ($kanbanViewMode === ViewMode::MODE_ACTIVITIES ? 'Y' : 'N'),
			'SHOW_ACTIVITY' => 'Y',
			'EXTRA' => [
				'CATEGORY_ID' => $categoryID,
				'ANALYTICS' => [
					'c_section' => Dictionary::SECTION_DEAL,
					'c_sub_section' => $subSection,
				],
			],
			'PATH_TO_IMPORT' => $arResult['PATH_TO_DEAL_IMPORT'],
			'PATH_TO_DEAL_KANBANCATEGORY' => $arResult['PATH_TO_DEAL_KANBANCATEGORY'],
			'PATH_TO_MERGE' => $arResult['PATH_TO_DEAL_MERGE'],
			'HEADERS_SECTIONS' => [
				[
					'id'=> CCrmOwnerType::DealName,
					'name' => Loc::getMessage('CRM_COMMON_DEAL'),
					'default' => true,
					'selected' => true,
				],
				[
					'id'=> CCrmOwnerType::ContactName,
					'name' => Loc::getMessage('CRM_COMMON_CONTACT'),
					'default' => false,
					'selected' => true,
					'sections' => [
						'contact_fields',
					],
				],
				[
					'id'=> CCrmOwnerType::CompanyName,
					'name' => Loc::getMessage('CRM_COMMON_COMPANY'),
					'default' => false,
					'selected' => true,
					'sections' => [
						'company_fields',
					],
				],
			],
		],
		$component
	);

	$APPLICATION->IncludeComponent(
		'bitrix:crm.deal.checker',
		'',
		['CATEGORY_ID' => $categoryID],
		null,
		['HIDE_ICONS' => 'Y']
	);
}

echo (\Bitrix\Crm\Tour\AiPreset::getInstance()->build());
