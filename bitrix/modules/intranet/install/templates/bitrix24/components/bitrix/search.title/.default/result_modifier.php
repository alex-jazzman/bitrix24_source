<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

use Bitrix\Crm\Settings\DealSettings;
use Bitrix\Crm\Settings\LeadSettings;
use Bitrix\Crm\Settings\InvoiceSettings;
use Bitrix\Crm\Settings\QuoteSettings;
use Bitrix\Crm\Settings\EntityViewSettings;

$arResult["GLOBAL_SEARCH_CATEGORIES"] = array();

$arResult["IS_EXTRANET_SITE"] = (
	\Bitrix\Main\Loader::includeModule('extranet')
		? (SITE_ID == \CExtranet::getExtranetSiteID())
		: false
);
$isCollaber = $arResult['IS_EXTRANET_SITE']
	&& \Bitrix\Extranet\Service\ServiceContainer::getInstance()->getCollaberService()->isCollaberById($USER->GetID());

if (!$isCollaber)
{
	$globalSearchCategories['stream'] = [
		'url' => ($arResult['IS_EXTRANET_SITE'] ? SITE_DIR : SITE_DIR . 'stream/') . '?' . (\Bitrix\Main\Composite\Helper::isOn() ? 'ncc=1&' : '').'apply_filter=Y&FIND=',
		'text' => GetMessage('CT_BST_GLOBAL_SEARCH_NEWS')
	];
}

$globalSearchCategories['tasks'] = [
	'url' => ($arResult['IS_EXTRANET_SITE'] ? SITE_DIR. 'contacts/' : SITE_DIR . 'company/') . 'personal/user/' . $USER->GetID() . '/tasks/?apply_filter=Y&with_preset=Y&FIND=',
	'text' => GetMessage('CT_BST_GLOBAL_SEARCH_TASKS'),
];

if (!$arResult["IS_EXTRANET_SITE"])
{
	$globalSearchCategories["calendar"] = array(
		"url" => ($arResult["IS_EXTRANET_SITE"] ? SITE_DIR."contacts/" : SITE_DIR."company/")."personal/user/".$USER->GetID()."/calendar/?apply_filter=Y&with_preset=Y&FIND=",
		"text" => GetMessage("CT_BST_GLOBAL_SEARCH_CALENDAR")
	);
}

$globalCrmSearchCategories = [];

if (\Bitrix\Intranet\Integration\Crm::getInstance()->canReadSomeItemsInCrm())
{
	global $CACHE_MANAGER;
	$cache = new \CPHPCache;

	$userId = $USER->GetID();
	$crmUserPermissions = \Bitrix\Crm\Service\Container::getInstance()->getUserPermissions($userId);

	$cacheId = "CRM_SEARCH_TITLE_".$userId;
	$cacheDir = "/crm/search_title_".substr(md5($userId), -2)."/".$userId."/";


	if ($cache->initCache(7200, $cacheId, $cacheDir))
	{
		$cacheVars = $cache->getVars();
		$globalCrmSearchCategories = $cacheVars["CRM_SEARCH_CATEGORIES"];
	}
	else
	{
		$cache->startDataCache();

		$CACHE_MANAGER->StartTagCache($cacheDir);
		$CACHE_MANAGER->RegisterTag('crm_change_role');

		$isAdmin = $crmUserPermissions->isAdmin();

		if ($isAdmin || $crmUserPermissions->entityType()->canReadItems(CCrmOwnerType::Lead))
		{
			$leadPaths = [
				EntityViewSettings::LIST_VIEW => CrmCheckPath('PATH_TO_LEAD_LIST', "", SITE_DIR . 'crm/lead/list/'),
				EntityViewSettings::KANBAN_VIEW => CrmCheckPath('PATH_TO_LEAD_KANBAN', "", SITE_DIR . 'crm/lead/kanban/')
			];
			$currentView = LeadSettings::getCurrent()->getCurrentListViewID();
			$leadPath = isset($leadPaths[$currentView]) ? $leadPaths[$currentView] : $leadPaths[EntityViewSettings::LIST_VIEW];

			$globalCrmSearchCategories["lead"] = [
				"url" => $leadPath . "?apply_filter=Y&with_preset=Y&FIND=",
				"text" => GetMessage("CT_BST_GLOBAL_SEARCH_CRM_LEAD")
			];
		}

		if ($isAdmin || $crmUserPermissions->entityType()->canReadItems(CCrmOwnerType::Deal))
		{
			$dealPaths = [
				EntityViewSettings::LIST_VIEW => CrmCheckPath('PATH_TO_DEAL_LIST', "", SITE_DIR . 'crm/deal/list/'),
				EntityViewSettings::KANBAN_VIEW => CrmCheckPath('PATH_TO_DEAL_KANBAN', "", SITE_DIR . 'crm/deal/kanban/')
			];
			$currentView = DealSettings::getCurrent()->getCurrentListViewID();
			$dealPath = isset($dealPaths[$currentView]) ? $dealPaths[$currentView] : $dealPaths[EntityViewSettings::LIST_VIEW];

			$globalCrmSearchCategories["deal"] = [
				"url" => $dealPath . "?apply_filter=Y&with_preset=Y&FIND=",
				"text" => GetMessage("CT_BST_GLOBAL_SEARCH_CRM_DEAL")
			];
		}

		$crm = \Bitrix\Intranet\Integration\Crm::getInstance();
		if (
			$crm->isOldInvoicesEnabled()
			&& (
				$isAdmin
				|| $crmUserPermissions->entityType()->canReadItems(CCrmOwnerType::Invoice)
			)
		)
		{
			$invoicePaths = [
				EntityViewSettings::LIST_VIEW => CrmCheckPath('PATH_TO_INVOICE_LIST', "", SITE_DIR . 'crm/invoice/list/'),
				EntityViewSettings::KANBAN_VIEW => CrmCheckPath('PATH_TO_INVOICE_KANBAN', "", SITE_DIR . 'crm/invoice/kanban/')
			];

			$currentView = InvoiceSettings::getCurrent()->getCurrentListViewID();
			$invoicePath = isset($invoicePaths[$currentView]) ? $invoicePaths[$currentView] : $invoicePaths[EntityViewSettings::LIST_VIEW];

			$globalCrmSearchCategories["invoice"] = [
				"url" => $invoicePath . "?apply_filter=Y&with_preset=Y&FIND=",
				"text" => \CCrmOwnerType::GetCategoryCaption(\CCrmOwnerType::Invoice),
			];
		}

		if (
			$crm->isSmartInvoicesEnabled()
			&& (
				$isAdmin
				|| $crmUserPermissions->entityType()->canReadItems(CCrmOwnerType::SmartInvoice)
			)
		)
		{
			$listUrl = $crm->getItemListUrlInCurrentView(\CCrmOwnerType::SmartInvoice);
			if ($listUrl)
			{
				$listUrl->addParams([
					'apply_filter' => 'Y',
					'with_preset' => 'Y',
					'FIND' => '',
				]);
			}

			$globalCrmSearchCategories[mb_strtolower(\CCrmOwnerType::SmartInvoiceName)] = [
				'url' => (string)$listUrl,
				'text' => \CCrmOwnerType::GetCategoryCaption(\CCrmOwnerType::SmartInvoice),
			];
		}

		if ($isAdmin || $crmUserPermissions->entityType()->canReadItems(CCrmOwnerType::Quote))
		{
			$quotePaths = [
				EntityViewSettings::LIST_VIEW => CrmCheckPath('PATH_TO_QUOTE_LIST', "", SITE_DIR . 'crm/quote/list/'),
				EntityViewSettings::KANBAN_VIEW => CrmCheckPath('PATH_TO_QUOTE_KANBAN', "", SITE_DIR . 'crm/quote/kanban/')
			];
			$currentView = QuoteSettings::getCurrent()->getCurrentListViewID();
			$quotePath = isset($quotePaths[$currentView]) ? $quotePaths[$currentView] : $quotePaths[EntityViewSettings::LIST_VIEW];

			$globalCrmSearchCategories["quote"] = [
				"url" => $quotePath . "?apply_filter=Y&with_preset=Y&FIND=",
				"text" => GetMessage("CT_BST_GLOBAL_SEARCH_CRM_QUOTE_MSGVER_1")
			];
		}

		if ($isAdmin || $crmUserPermissions->entityType()->canReadItems(CCrmOwnerType::Contact))
		{
			$globalCrmSearchCategories["contact"] = [
				"url" => SITE_DIR . "crm/contact/list/?apply_filter=Y&with_preset=Y&FIND=",
				"text" => GetMessage("CT_BST_GLOBAL_SEARCH_CRM_CONTACT")
			];
		}

		if ($isAdmin || $crmUserPermissions->entityType()->canReadItems(CCrmOwnerType::Company))
		{
			$globalCrmSearchCategories["company"] = [
				"url" => SITE_DIR . "crm/company/list/?apply_filter=Y&with_preset=Y&FIND=",
				"text" => GetMessage("CT_BST_GLOBAL_SEARCH_CRM_COMPANY")
			];
		}

		$globalCrmSearchCategories["activity"] = [
			"url" => SITE_DIR . "crm/activity/list/?apply_filter=Y&with_preset=Y&FIND=",
			"text" => GetMessage("CT_BST_GLOBAL_SEARCH_CRM_ACTIVITY")
		];

		$CACHE_MANAGER->EndTagCache();
		$cache->endDataCache([
			"CRM_SEARCH_CATEGORIES" => $globalCrmSearchCategories
		]);
	}
}

$globalSearchCategories = array_merge($globalSearchCategories, $globalCrmSearchCategories);

if (
	!$isCollaber
	&& CModule::IncludeModule("lists")
	&& CLists::isFeatureEnabled()
)
{
	$globalSearchCategories["processes"] = [
		"url" => ($arResult["IS_EXTRANET_SITE"] ? SITE_DIR."contacts/" : SITE_DIR."company/")."personal/processes/?apply_filter=Y&with_preset=Y&FIND=",
		"text" => GetMessage("CT_BST_GLOBAL_SEARCH_PROCESS")
	];
}

if (\Bitrix\Main\ModuleManager::isModuleInstalled("disk"))
{
	$globalSearchCategories["disk"] = array(
		"url" => SITE_DIR."company/personal/user/".$USER->GetID()."/disk/path/?apply_filter=Y&with_preset=Y&FIND=",
		"text" => GetMessage("CT_BST_GLOBAL_SEARCH_DISK_MSGVER_1")
	);
}

if (
	!$arResult["IS_EXTRANET_SITE"]
	&& \Bitrix\Main\ModuleManager::isModuleInstalled("landing")
)
{
	$globalSearchCategories["sites"] = array(
		"url" => SITE_DIR."sites/?apply_filter=Y&with_preset=Y&FIND=",
		"text" => GetMessage("CT_BST_GLOBAL_SEARCH_SITE")
	);
}

//preset
$presetId = CUserOptions::GetOption("intranet", "left_menu_preset_".SITE_ID);
if (!$presetId)
{
	$presetId = COption::GetOptionString("intranet", "left_menu_preset", "");
}
$sort = array("stream", "tasks", "calendar", "disk", "lead", "deal", "invoice", "smart_invoice", "contact", "company", "quote", "activity", "sites", "processes");
switch ($presetId)
{
	case "tasks":
		$sort = array("tasks", "stream", "calendar", "disk", "lead", "deal", "invoice", "smart_invoice", "contact", "company", "quote", "activity", "sites", "processes");

		break;
	case "crm":
		$sort = array("lead", "deal", "invoice", "smart_invoice", "contact", "company", "quote", "activity", "tasks",  "calendar", "stream", "disk", "sites", "processes");

		break;
	case "sites":
		$sort = array("sites", "lead", "deal", "invoice", "smart_invoice", "contact", "company", "quote", "activity", "tasks", "stream",  "calendar",  "disk", "processes");

		break;
}

foreach($sort as $key)
{
	if (!isset($globalSearchCategories[$key]))
		continue;

	$arResult["GLOBAL_SEARCH_CATEGORIES"][$key] = $globalSearchCategories[$key];
}

//add unsorted categories at the end of the list
$arResult['GLOBAL_SEARCH_CATEGORIES'] += $globalSearchCategories;

//You may customize user card fields to display
$arResult['USER_PROPERTY'] = array(
	"UF_DEPARTMENT",
);

//Code below searches for appropriate icon for search index item.
//All filenames should be lowercase.

//1
//Check if index item is information block element with property DOC_TYPE set.
//This property should be type list and we'll take it's values XML_ID as parameter
//iblock_doc_type_<xml_id>.png

//2
//When no such fle found we'll check for section attributes
//iblock_section_<code>.png
//iblock_section_<id>.png
//iblock_section_<xml_id>.png

//3
//Next we'll try to detect icon by "extention".
//where extension is all a-z between dot and end of title
//iblock_type_<iblock type id>_<extension>.png

//4
//If we still failed. Try to match information block attributes.
//iblock_iblock_<code>.png
//iblock_iblock_<id>.png
//iblock_iblock_<xml_id>.png

//5
//If indexed item is section when checkj for
//iblock_section.png
//If it is an element when chek for
//iblock_element.png

//6
//If item belongs to main module (static file)
//when check is done by it's extention
//main_<extention>.png

//7
//For blog module we'll check if icon for post or user exists
//blog_post.png
//blog_user.png

//8, 9 and 10
//forum_message.png
//intranet_user.png
//socialnetwork_group.png

//11
//In case we still failed to find an icon
//<module_id>_default.png

//12
//default.png

$arIBlocks = array();

$image_path = $this->GetFolder()."/images/";
$abs_path = $_SERVER["DOCUMENT_ROOT"].$image_path;
require_once($_SERVER["DOCUMENT_ROOT"].$this->GetFolder().'/class.php');

for($i = 0; $i < $arParams["NUM_CATEGORIES"]; $i++)
{
	$categoryCode = $arParams["CATEGORY_".$i];

	if (is_array($categoryCode))
	{
		$categoryCode = $categoryCode[0];
	}

	$categoryTitle = trim($arParams["CATEGORY_".$i."_TITLE"]);
	if(empty($categoryTitle))
		continue;

	switch($categoryCode)
	{
		case "custom_users":
			$prefix = 'U';
			break;
		case "custom_sonetgroups":
			$prefix = 'G';
			break;
		case "custom_menuitems":
			$prefix = 'M';
			break;
		default:
			$prefix = '';
	}

	$arResult["CATEGORIES_ALL"][$i] = array(
		"TITLE" => htmlspecialcharsbx($categoryTitle),
		"CODE" => $categoryCode,
		"CLIENTDB_PREFIX" => $prefix
	);
}

if (!empty($arResult["query"]))
{
	if (!empty($_REQUEST["get_all"]))
	{
		$entitiesList = array();
		$entity = $_REQUEST["get_all"];
		if ($entity == 'sonetgroups')
		{
			$sonetGroupsList = CB24SearchTitle::getSonetGroups();
			foreach($sonetGroupsList as $group)
			{
				$entitiesList['G'.$group['ID']] = CB24SearchTitle::convertAjaxToClientDb($group, $entity);
			}
		}
		elseif ($entity == 'menuitems')
		{
			$menuItemsList = CB24SearchTitle::getMenuItems();
			foreach($menuItemsList as $menuItem)
			{
				$entitiesList['M'.$menuItem['URL']] = CB24SearchTitle::convertAjaxToClientDb($menuItem, $entity);
			}
		}

		$arResult['ALLENTITIES'] = $entitiesList;
	}

	$arResult["customUsersCategoryId"] = $arResult["customSonetGroupsCategoryId"] = false;
	$arResult["customResultEmpty"] = true;

	$searchString = ($arResult["alt_query"] ? $arResult["alt_query"] : $arResult["query"]);

	CB24SearchTitle::customSearch($searchString, $arParams, $arResult);

	if (
		$arResult["customResultEmpty"]
		&& $searchString == $arResult["alt_query"]
		&& $arResult["alt_query"] != $arResult["query"]
	) // if alt_query is guessed by mistake
	{
		CB24SearchTitle::customSearch($arResult["query"], $arParams, $arResult);
	}

	unset($arResult["customResultEmpty"]);

	for($i = 0; $i < $arParams["NUM_CATEGORIES"]; $i++)
	{
		$categoryCode = $arParams["CATEGORY_".$i];

		if (is_array($categoryCode))
		{
			$categoryCode = $categoryCode[0];
		}

		if (
			mb_strpos($categoryCode, 'custom_') === 0
			&& empty($arResult["CATEGORIES"][$i]["ITEMS"])
		)
		{
			unset($arResult["CATEGORIES"][$i]);
		}

		if ($categoryCode === "iblock_structure")
		{
			foreach($arResult["CATEGORIES"][$i]["ITEMS"] as $key => $item)
			{
				if (isset($item["URL"]))
				{
					$arResult["CATEGORIES"][$i]["ITEMS"][$key]["URL"] = htmlspecialcharsback($item["URL"]);
				}
			}
		}
	}

	if (
		!empty($arResult["CATEGORIES"]["others"])
		&& !empty($arResult["CATEGORIES"]["others"]["ITEMS"])
	)
	{
		foreach($arResult["CATEGORIES"]["others"]["ITEMS"] as $itemId => $arItem)
		{
			if (
				intval($arResult["customUsersCategoryId"]) > 0
				&& !empty($arResult["CATEGORIES"][$arResult["customUsersCategoryId"]]["ITEMS"])
				&& $arItem['MODULE_ID'] == 'intranet'
				&& preg_match('/^U(\d+)$/i', $arItem['ITEM_ID'], $matches)
			)
			{
				foreach($arResult["CATEGORIES"][$arResult["customUsersCategoryId"]]["ITEMS"] as $arUserItem)
				{
					if ($arItem['ITEM_ID'] == $arUserItem['ITEM_ID'])
					{
						unset($arResult["CATEGORIES"]["others"]["ITEMS"][$itemId]);
						break;
					}
				}
			}

			if (
				intval($arResult["customSonetGroupsCategoryId"]) > 0
				&& !empty($arResult["CATEGORIES"][$arResult["customSonetGroupsCategoryId"]]["ITEMS"])
				&& $arItem['MODULE_ID'] == 'socialnetwork'
				&& preg_match('/^G(\d+)$/i', $arItem['ITEM_ID'], $matches)
			)
			{
				foreach($arResult["CATEGORIES"][$arResult["customSonetGroupsCategoryId"]]["ITEMS"] as $arSonetGroupItem)
				{
					if ($arItem['ITEM_ID'] == $arSonetGroupItem['ITEM_ID'])
					{
						unset($arResult["CATEGORIES"]["others"]["ITEMS"][$itemId]);
						break;
					}
				}
			}
		}

		$arResult["CATEGORIES"]["others"]["ITEMS"] = array_values($arResult["CATEGORIES"]["others"]["ITEMS"]);
		if (empty($arResult["CATEGORIES"]["others"]["ITEMS"]))
		{
			unset($arResult["CATEGORIES"]["others"]);
		}

		foreach($arResult["CATEGORIES"] as $code => $category)
		{
			if (in_array($code, array('all', 'custom_users', 'custom_sonetgroups', 'custom_menugroups')))
			{
				continue;
			}

			if (
				!empty($arResult["CATEGORIES"][$code]["ITEMS"])
				&& is_array($arResult["CATEGORIES"][$code]["ITEMS"])
			)
			{
				foreach($arResult["CATEGORIES"][$code]["ITEMS"] as $key => $item)
				{
					if (isset($item["URL"]))
					{
						$arResult["CATEGORIES"][$code]["ITEMS"][$key]["URL"] = htmlspecialcharsBack($item["URL"]);
					}
				}
			}
		}
	}
}

unset($arResult["customUsersCategoryId"]);
unset($arResult["customSonetGroupsCategoryId"]);

$arResult["SEARCH"] = array();
foreach($arResult["CATEGORIES"] as $category_id => $arCategory)
{
	foreach($arCategory["ITEMS"] as $i => $arItem)
	{
		if(isset($arItem["ITEM_ID"]))
		{
			$arResult["SEARCH"][] = &$arResult["CATEGORIES"][$category_id]["ITEMS"][$i];
		}
	}
}

foreach($arResult["SEARCH"] as $i=>$arItem)
{
	if (!isset($arResult["SEARCH"][$i]["ICON"]))
	{
		$arResult["SEARCH"][$i]["ICON"] = '';
	}
}
?>
