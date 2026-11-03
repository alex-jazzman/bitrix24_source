<?php
use Bitrix\Main\Loader;
use Bitrix\Main\Provider\Params\Pager;
use Bitrix\Sale\Public\Provider\BuyerProvider;
use Bitrix\Sale\Public\Provider\Params\BuyerFilter;
use Bitrix\Sale\Public\Provider\Params\BuyerSort;
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
Loader::includeModule('sale');
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/prolog.php");

IncludeModuleLangFile(__FILE__);

/** @global CMain $APPLICATION */
/** @global CAdminPage $adminPage */
global $adminPage;
/** @global CAdminSidePanelHelper $adminSidePanelHelper */
global $adminSidePanelHelper;

$publicMode = $adminPage->publicMode;
$selfFolderUrl = $adminPage->getSelfFolderUrl();

$saleModulePermissions = $APPLICATION->GetGroupRight("sale");
if ($saleModulePermissions == "D")
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

if(!CBXFeatures::IsFeatureEnabled('SaleAccounts'))
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

	ShowError(GetMessage("SALE_FEATURE_NOT_ALLOW"));

	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	return;
}

$isWithOrdersMode = true;
if (Loader::includeModule('crm'))
{
	$isWithOrdersMode = CCrmSaleHelper::isWithOrdersMode();
}

ClearVars();

/*****************************************************************************/
/******************************** BUYERS *************************************/
/*****************************************************************************/

$APPLICATION->SetTitle(GetMessage("BUYER_TITLE"));

$rsSites = CSite::GetList("sort", "desc", array("ACTIVE" => "Y"));
$arSites = array();
while ($arSite = $rsSites->Fetch())
	$arSites[$arSite["ID"]] = array("ID" => $arSite["ID"], "NAME" => $arSite["NAME"]);

$arUsersGroups = array();
$dbGroups = CGroup::GetList("c_sort", "asc", array("ANONYMOUS" => "N"));
while ($arGroups = $dbGroups->Fetch())
	$arUsersGroups[] = $arGroups;

$sTableID = "tbl_sale_buyers";
$oSort = new CAdminUiSorting($sTableID, "LAST_ORDER_DATE", "desc");
global $by, $order;
$lAdmin = new CAdminUiList($sTableID, $oSort);

$arFilter = array();

$listGroup = array();
$groupQueryObject = CGroup::getDropDownList("AND ID!=2");
while ($group = $groupQueryObject->fetch())
{
	$listGroup[$group["REFERENCE_ID"]] = $group["REFERENCE"];
}
$listCurrency = array();
$currencyList = Bitrix\Currency\CurrencyManager::getCurrencyList();
foreach ($currencyList as $currencyId => $currencyName)
{
	$listCurrency[$currencyId] = $currencyName;
}
$listSite = array();
$sitesQueryObject = CSite::getList("sort", "asc", array("ACTIVE" => "Y"));
while ($site = $sitesQueryObject->fetch())
{
	$listSite[$site["LID"]] = $site["NAME"]." [".$site["LID"]."]";
}

$filterFields = array(
	array(
		"id" => "BUYER",
		"name" => GetMessage('BUYER_ROW_BUYER'),
		"filterable" => "",
		"quickSearch" => "",
		"default" => true
	),
	array(
		"id" => "USER_ID",
		"name" => GetMessage('BUYER_F_ID'),
		"type" => "number",
		"filterable" => ""
	),
	array(
		"id" => "USER.LOGIN",
		"name" => GetMessage("BUYER_F_LOGIN"),
		"filterable" => ""
	),
	array(
		"id" => "USER.EMAIL",
		"name" => GetMessage("BUYER_F_MAIL"),
		"filterable" => ""
	),
	array(
		"id" => "USER.PERSONAL_PHONE",
		"name" => GetMessage("BUYER_F_PHONE"),
		"filterable" => "%"
	),
	array(
		"id" => "USER.LAST_LOGIN",
		"name" => GetMessage("BUYER_F_DATE_AUTH"),
		"type" => "date",
		"filterable" => ""
	),
	array(
		"id" => "SUM_PAID",
		"name" => GetMessage("BUYER_F_PAID_ALL"),
		"type" => "number",
		"filterable" => ""
	),
	array(
		"id" => "COUNT_FULL_PAID_ORDER",
		"name" => GetMessage("BUYER_F_QUANTITY_FULL"),
		"type" => "number",
		"filterable" => ""
	),
	array(
		"id" => "COUNT_PART_PAID_ORDER",
		"name" => GetMessage("BUYER_F_QUANTITY_PART"),
		"type" => "number",
		"filterable" => ""
	),
	array(
		"id" => "LAST_ORDER_DATE",
		"name" => GetMessage("BUYER_F_LAST_ORDER_DATE"),
		"type" => "date",
		"filterable" => ""
	),
	array(
		"id" => "USER.DATE_REGISTER",
		"name" => GetMessage("BUYER_ROW_DATE_REGISTER"),
		"type" => "date",
		"filterable" => ""
	),
	array(
		"id" => "GROUP.GROUP_ID",
		"name" => GetMessage("BUYER_F_GROUP"),
		"type" => "list",
		"items" => $listGroup,
		"params" => array("multiple" => "Y"),
		"filterable" => ""
	),
	array(
		"id" => "CURRENCY",
		"name" => GetMessage("BUYER_F_CURRENCY"),
		"type" => "list",
		"items" => $listCurrency,
		"filterable" => ""
	),
	array(
		"id" => "LID",
		"name" => GetMessage("BUYER_ORDERS_LID"),
		"type" => "list",
		"items" => $listSite,
		"filterable" => ""
	),
);

$filterPresets = array(
	"best_buyers" => array(
		"name" => GetMessage("BUYER_F_BEST")
	),
	"new_buyers" => array(
		"name" => GetMessage("BUYER_F_BUYERS_NEW")
	)
);
$lAdmin->setFilterPresets($filterPresets);

$lAdmin->AddFilter($filterFields, $arFilter);

$arSitesShop = array();
foreach ($arSites as $key => $val)
{
	$site = COption::GetOptionString("sale", "SHOP_SITE_".$key, "");
	if ($key == $site)
		$arSitesShop[] = array("ID" => $key, "NAME" => $val["NAME"]);
}
if (empty($arSitesShop))
	$arSitesShop = $arSites;

$arHeaders = array(
	array("id"=>"USER_ID", "content"=>"ID", "sort"=>"USER_ID"),
	array("id"=>"BUYER","content"=>GetMessage("BUYER_ROW_BUYER"), "sort"=>"NAME", "default"=>true),
	array("id"=>"LOGIN","content"=>GetMessage("BUYER_ROW_LOGIN"), "sort"=>"LOGIN"),
	array("id"=>"LAST_NAME","content"=>GetMessage("BUYER_ROW_LAST"), "sort"=>"LAST_NAME"),
	array("id"=>"NAME","content"=>GetMessage("BUYER_ROW_NAME"), "sort"=>"NAME"),
	array("id"=>"SECOND_NAME","content"=>GetMessage("BUYER_ROW_SECOND"), "sort"=>"SECOND_NAME"),
	array("id"=>"EMAIL","content"=>GetMessage("BUYER_ROW_MAIL"), "sort"=>"EMAIL", "default"=>true),
	array("id"=>"PERSONAL_PHONE","content"=>GetMessage("BUYER_ROW_PHONE"), "sort"=>"PERSONAL_PHONE", "default"=>true),
	array("id"=>"LAST_LOGIN","content"=>GetMessage('BUYER_ROW_LAST_LOGIN'), "sort"=>"LAST_LOGIN", "default"=>false),
	array("id"=>"DATE_REGISTER","content"=>GetMessage('BUYER_ROW_DATE_REGISTER'), "sort"=>"DATE_REGISTER", "default"=>true),
	array("id"=>"LAST_ORDER_DATE","content"=>GetMessage('BUYER_ROW_LAST_ORDER_DATE'), "sort"=>"LAST_ORDER_DATE", "default"=>false),
	array("id"=>"LID","content"=>GetMessage('BUYER_ROW_LID'), "default"=>true),
	array("id"=>"COUNT_FULL_PAID_ORDER","content"=>GetMessage('BUYER_ROW_COUNT_FULL_PAID_ORDER'), "sort"=>"COUNT_FULL_PAID_ORDER", "default"=>true, "align" => "right"),
	array("id"=>"COUNT_PART_PAID_ORDER","content"=>GetMessage('BUYER_ROW_COUNT_PART_PAID_ORDER'), "sort"=>"COUNT_PART_PAID_ORDER", "default"=>true, "align" => "right"),
	array("id"=>"SUM_PAID","content"=>GetMessage('BUYER_ROW_SUM_PAID'), "sort"=>"SUM_PAID", "default"=>true, "align" => "right"),
	array("id"=>"GROUPS_ID","content"=>GetMessage('BUYER_ROW_GROUP')),
);
$lAdmin->AddHeaders($arHeaders);
$arVisibleColumns = $lAdmin->GetVisibleHeaderColumns();

$buyerProvider = new BuyerProvider();

$navyParams = CDBResult::GetNavParams(CAdminUiResult::GetNavSize($sTableID));
$navyParams['PAGEN'] = max(1, (int)$navyParams['PAGEN']);
$navyParams['SIZEN'] = max(1, (int)$navyParams['SIZEN']);
// The export takes the whole list and so does the classic list asked to show all of it; the public
// mode has always shown a page at a time.
$wholeList = !$publicMode && ($lAdmin->isExportMode() || $navyParams['SHOW_ALL']);

// The field «Buyer» of the filter, which also takes the quick search string, is matched against the
// buyer in either mode.
$buyerFilter = new BuyerFilter($arFilter, (string)($arFilter['BUYER'] ?? ''));
$defaultSort = [BuyerSort::DEFAULT_FIELD => BuyerSort::DEFAULT_DIRECTION];
$excludedUserId = 0;
$shopGroupId = 0;

if ($publicMode && Loader::includeModule('crm'))
{
	$gridOptions = new \Bitrix\Main\Grid\Options($sTableID);
	$sorting = $gridOptions->getSorting(['sort' => $defaultSort]);

	$buyerSort = new BuyerSort($sorting['sort']);
	$excludedUserId = (int)\Bitrix\Crm\Order\Manager::getAnonymousUserID();
	// The public list is made of the shop buyers group: a buyer added from it is listed before the
	// first order, with zeros.
	$shopGroupId = (int)\Bitrix\Crm\Order\BuyerGroup::getSystemGroupId();
}
else
{
	if ($by === 'COUNT_ORDER')
	{
		$by = 'COUNT_FULL_PAID_ORDER';
	}

	$buyerSort = new BuyerSort(is_string($by) && $by !== '' ? [$by => (string)$order] : $defaultSort);
}

$pager = null;
if (!$wholeList)
{
	// The count takes the same conditions as the rows, so the navigation follows the filter.
	$totalCount = $buyerProvider->countBuyers($buyerFilter, $excludedUserId, $shopGroupId);
	// A page past the end of the list, left over from a wider filter, is taken for its last page.
	$totalPages = (int)ceil($totalCount / $navyParams['SIZEN']);
	$navyParams['PAGEN'] = max(1, min($navyParams['PAGEN'], $totalPages));
	$pager = (new Pager($navyParams['SIZEN']))->setPage($navyParams['PAGEN']);
}
$buyers = $buyerProvider->getBuyers($buyerFilter, $buyerSort, $pager, $excludedUserId, $shopGroupId);

$userIdList = $buyers->getUserIds();

// A row is the statistic of the buyer on one site in one currency: a buyer who has paid in two
// currencies is two rows, each keyed by its own id and signed with its own currency. A buyer of the
// public list who has paid for nothing is one row without statistic, keyed by the buyer and shown
// with the currency and the site of the page, as the list has always shown such a buyer.
$defaultSiteId = defined('SITE_ID') ? SITE_ID : '';
$defaultCurrency = Bitrix\Sale\Internals\SiteCurrencyTable::getSiteCurrency($defaultSiteId);
$buyerRows = [];
foreach ($buyers as $buyer)
{
	$buyerRows[] = [
		'ID' => $buyer->id > 0 ? (string)$buyer->id : 'buyer-' . $buyer->userId,
		'USER_ID' => $buyer->userId,
		'LOGIN' => $buyer->login,
		'NAME' => $buyer->name,
		'LAST_NAME' => $buyer->lastName,
		'SECOND_NAME' => $buyer->secondName,
		'EMAIL' => $buyer->email,
		'PERSONAL_PHONE' => $buyer->personalPhone,
		'LAST_LOGIN' => $buyer->lastLogin,
		'DATE_REGISTER' => $buyer->dateRegister,
		'EXTERNAL_AUTH_ID' => $buyer->externalAuthId,
		'SUM_PAID' => $buyer->sumPaid,
		'COUNT_FULL_PAID_ORDER' => $buyer->countFullPaidOrder,
		'COUNT_PART_PAID_ORDER' => $buyer->countPartPaidOrder,
		'LAST_ORDER_DATE' => $buyer->lastOrderDate,
		'CURRENCY' => $buyer->currency !== '' ? $buyer->currency : $defaultCurrency,
		'LID' => $buyer->siteId !== '' ? $buyer->siteId : $defaultSiteId,
	];
}

if (!empty($userIdList))
{
	$buyerNames = GetFormatedUserName($userIdList, false, !$publicMode);
}

$resultUsersList = new CAdminUiResult(null, $sTableID);
$resultUsersList->InitFromArray($buyerRows);

if ($pager !== null)
{
	// The rows are the page already: the navigation is told the size of the whole list instead.
	$resultUsersList->NavStart($pager->getLimit(), $navyParams['SHOW_ALL'], $navyParams['PAGEN']);
	$resultUsersList->NavRecordCount = $totalCount;
	$resultUsersList->NavPageCount = $totalCount > 0 ? (int)ceil($totalCount / $pager->getLimit()) : 0;
	$resultUsersList->NavPageNomer = $navyParams['PAGEN'];
}
else
{
	$resultUsersList->NavStart();
}

$lAdmin->SetNavigationParams($resultUsersList, array("BASE_LINK" => $selfFolderUrl."sale_buyers.php"));
$isIntranetInstalled = IsModuleInstalled('intranet');
$isCrmInstalled = IsModuleInstalled('crm');

while ($arBuyers = $resultUsersList->Fetch())
{
	$userId = $arBuyers['USER_ID'];

	$profileUrl = $selfFolderUrl."sale_buyers_profile.php?USER_ID=".$userId."&lang=".LANGUAGE_ID;
	$profileUrl = $adminSidePanelHelper->editUrlToPublicPage($profileUrl);

	if(
		$publicMode
		&& $isIntranetInstalled
		&& $isCrmInstalled
		&& $arBuyers['EXTERNAL_AUTH_ID'] !== \Bitrix\Crm\Order\Buyer::AUTH_ID
	)
	{
		$editUrl = '/company/personal/user/'.$userId.'/';
	}
	else
	{
		$editUrl = '/shop/buyer/'.$userId.'/edit/';
	}

	$row =& $lAdmin->AddRow($arBuyers['ID'], $arBuyers, $profileUrl, GetMessage("BUYER_SUB_ACTION_PROFILE"));

	$profile = '<a href="'.$profileUrl.'">'.$userId.'</a>';
	$row->AddField("USER_ID", $profile);

	if (in_array("SUM_PAID", $arVisibleColumns))
		$row->AddField("SUM_PAID", SaleFormatCurrency($arBuyers["SUM_PAID"], $arBuyers["CURRENCY"]));

	if (in_array("GROUPS_ID", $arVisibleColumns))
	{
		$strUserGroup = '';
		$arUserGroups = CUser::GetUserGroup($userId);

		foreach ($arUsersGroups as $arGroup)
		{
			if (in_array($arGroup["ID"], $arUserGroups))
				$strUserGroup .= htmlspecialcharsbx($arGroup["NAME"])."<br>";
		}
		$row->AddField("GROUPS_ID", $strUserGroup);
	}

	if (in_array("LID", $arVisibleColumns))
	{
		$row->AddField('LID', htmlspecialcharsbx((string)($arSites[$arBuyers['LID']]['NAME'] ?? '')));
	}

	/*BUYER*/
	// A statistic row may outlive its buyer record: the list keeps the row and says so in place of the name.
	$fieldBuyer = $buyerNames[$userId] ?? GetMessage('BUYER_ROW_BUYER_NOT_FOUND');
	$row->AddField("BUYER", $fieldBuyer);

	$arActions = array();
	$arActions[] = array(
		"ICON" => "view",
		"TEXT" => GetMessage("BUYER_SUB_ACTION_PROFILE"),
		"LINK" => $profileUrl,
		"DEFAULT" => true
	);

	if ($publicMode)
	{
		$arActions[] = array(
			'ICON' => 'edit',
			'TEXT' => GetMessage('BUYER_SUB_ACTION_EDIT_PROFILE'),
			'LINK' => $editUrl,
		);
	}

	foreach($arSitesShop as $val)
	{
		$addOrderUrl = "sale_order_create.php?USER_ID=".$userId."&SITE_ID=".$val["ID"]."&lang=".LANGUAGE_ID;
		if ($publicMode)
		{
			$addOrderUrl = "/shop/orders/details/0/?USER_ID=".$userId."&SITE_ID=".$val["ID"]."&lang=".LANGUAGE_ID;
		}
		if (!$publicMode || $isWithOrdersMode)
		{
			$arActions[] = array(
				"ICON" => "view",
				"TEXT" => GetMessage("BUYER_SUB_ACTION_ORDER")." [".$val["ID"]."]",
				"LINK" => $addOrderUrl,
			);
		}
	}

	$row->AddActions($arActions);
}

$aContext = array();
if ($publicMode)
{
	$aContext[] = array(
		"TEXT" => GetMessage("BUYER_ADD_USER"),
		"TITLE" => GetMessage("BUYER_ADD_USER"),
		"LINK" => "/shop/buyer/0/edit/",
		"PUBLIC" => true,
		"ICON" => "btn_new"
	);
}

$lAdmin->setContextSettings(array("pagePath" => $selfFolderUrl."sale_buyers.php"));
$lAdmin->AddAdminContextMenu($aContext);

$lAdmin->CheckListMode();

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/prolog.php");
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
if (!$publicMode && \Bitrix\Sale\Update\CrmEntityCreatorStepper::isNeedStub())
{
	$APPLICATION->IncludeComponent("bitrix:sale.admin.page.stub", ".default");
}
else
{
	$filterParams = [
		'CONFIG' => [
			'popupWidth' => 800,
		],
		'USE_CHECKBOX_LIST_FOR_SETTINGS_POPUP' => \Bitrix\Main\ModuleManager::isModuleInstalled('ui'),
		'ENABLE_FIELDS_SEARCH' => 'Y',
	];
	$lAdmin->DisplayFilter($filterFields, $filterParams);

	$listParams = [
		'USE_CHECKBOX_LIST_FOR_SETTINGS_POPUP' => \Bitrix\Main\ModuleManager::isModuleInstalled('ui'),
		'ENABLE_FIELDS_SEARCH' => 'Y',
	];
	$lAdmin->DisplayList($listParams);
}
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
