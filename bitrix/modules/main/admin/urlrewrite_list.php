<?php
/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 */

use Bitrix\Main\UrlRewriter;

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
define("HELP_FILE", "settings/urlrewrite_list.php");

if(!$USER->CanDoOperation('edit_php') && !$USER->CanDoOperation('view_other_settings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$isAdmin = $USER->CanDoOperation('edit_php');

IncludeModuleLangFile(__FILE__);

// идентификатор таблицы
$sTableID = "tbl_urlrewrite";

// инициализация сортировки
$oSort = new CAdminSorting($sTableID, "CONDITION", "asc");
// инициализация списка
$lAdmin = new CAdminList($sTableID, $oSort);

// инициализация параметров списка - фильтры
$arFilterFields = array(
	"filter_path",
	"filter_site_id",
	"filter_condition",
	"filter_id",
);

$filter = $lAdmin->InitFilter($arFilterFields);

$siteId = CSite::getDefSite($filter['filter_site_id'] ?? false);

$arFilter = array();

if (!empty($filter['filter_condition']))
{
	$arFilter["CONDITION"] = $filter['filter_condition'];
}
if (!empty($filter['filter_id']))
{
	$arFilter["ID"] = $filter['filter_id'];
}
if (!empty($filter['filter_path']))
{
	$arFilter["PATH"] = $filter['filter_path'];
}

// обработка действий групповых и одиночных
if (($arID = $lAdmin->GroupAction()) && $isAdmin)
{
	if (isset($_REQUEST['action_target']) && $_REQUEST['action_target']=='selected')
	{
		$arID = Array();
		$arResultList = UrlRewriter::getList($siteId, $arFilter);
		foreach ($arResultList as $arResult)
			$arID[] = $arResult["CONDITION"];
	}

	foreach ($arID as $ID)
	{
		if ($ID == '')
			continue;

		if ($_REQUEST['action'] == "delete")
		{
			UrlRewriter::delete($siteId, ["CONDITION" => $ID]);
		}
	}
}

// инициализация списка - выборка данных
$arResultList = UrlRewriter::getList($siteId, $arFilter, array($oSort->getField() => $oSort->getOrder()));

$dbResultList = new CDBResult;
$dbResultList->InitFromArray($arResultList);

$dbResultList = new CAdminResult($dbResultList, $sTableID);
$dbResultList->NavStart();

// установке параметров списка
$lAdmin->NavText($dbResultList->GetNavPrint(GetMessage("SAA_NAV")));

// заголовок списка
$lAdmin->AddHeaders(array(
	array("id"=>"CONDITION", "content"=>GetMessage("MURL_USL"), "sort"=>"CONDITION", "default"=>true),
	array("id"=>"ID","content"=>GetMessage("MURL_COMPONENT"), "sort"=>"ID", "default"=>true),
	array("id"=>"PATH", "content"=>GetMessage("MURL_FILE"),	"sort"=>"PATH", "default"=>true),
	array("id"=>"RULE", "content"=>GetMessage("MURL_RULE"), "sort"=>"RULE", "default"=>true),
));

$arVisibleColumns = $lAdmin->GetVisibleHeaderColumns();

// построение списка
while ($arResult = $dbResultList->NavNext(true, "f_"))
{
	$row = $lAdmin->AddRow($f_CONDITION ?? '', $arResult, "urlrewrite_edit.php?CONDITION=".UrlEncode($arResult["CONDITION"])."&lang=".LANGUAGE_ID."&site_id=".UrlEncode($siteId), GetMessage("MURL_EDIT"));

	$row->AddField("CONDITION", $f_CONDITION ?? '');
	$row->AddField("ID", $f_ID ?? '');
	$row->AddField("PATH", $f_PATH ?? '');
	$row->AddField("RULE", $f_RULE ?? '');

	$arActions = Array();
	$arActions[] = array("ICON"=>"edit", "TEXT"=>GetMessage("MURL_EDIT"), "ACTION"=>$lAdmin->ActionRedirect("urlrewrite_edit.php?CONDITION=".UrlEncode($arResult["CONDITION"])."&lang=".LANGUAGE_ID."&site_id=".UrlEncode($siteId)), "DEFAULT"=>true);
	if($isAdmin)
		$arActions[] = array("ICON"=>"delete", "TEXT"=>GetMessage("MURL_DELETE"), "ACTION"=>"if(confirm('".GetMessage("MURL_DELETE_CONF")."')) ".$lAdmin->ActionDoGroup(UrlEncode($arResult["CONDITION"]), "delete"));

	$row->AddActions($arActions);
}

// показ формы с кнопками добавления, ...
$lAdmin->AddGroupActionTable(
	array(
		"delete" => true,
	)
);

$arDDMenu = array();

$dbRes = CLang::GetList();
while(($arRes = $dbRes->Fetch()))
{
	$arDDMenu[] = array(
		"TEXT" => htmlspecialcharsbx("[".$arRes["LID"]."] ".$arRes["NAME"]),
		"ACTION" => "window.location = 'urlrewrite_edit.php?lang=".urlencode(LANGUAGE_ID)."&site_id=".urlencode($arRes["LID"])."';"
	);
}

$aContext = array(
	array(
		"TEXT" => GetMessage("MURL_NEW"),
		"TITLE" => GetMessage("MURL_NEW_TITLE"),
		"ICON" => "btn_new",
		"MENU" => $arDDMenu
	),
	array(
		"TEXT" => GetMessage("MURL_REINDEX"),
		"TITLE" => GetMessage("MURL_REINDEX_TITLE"),
		"LINK" => "urlrewrite_reindex.php?lang=".LANGUAGE_ID
	),
);

$lAdmin->AddAdminContextMenu($aContext);

// проверка на вывод только списка (в случае списка, скрипт дальше выполняться не будет)
$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("MURL_TITLE"));

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
?>
<form name="find_form" method="GET" action="<?= $APPLICATION->GetCurPage()?>?">
<?php
$oFilter = new CAdminFilter(
	$sTableID."_filter",
	array(
		GetMessage("MURL_FILTER_SITE"),
		GetMessage("MURL_USL"),
		GetMessage("MURL_COMPONENT"),
	)
);

$oFilter->Begin();
?>
	<tr>
		<td><?= GetMessage("MURL_FILTER_PATH") ?>:</td>
		<td align="left" nowrap>
			<input type="text" name="filter_path" size="50" value="<?= htmlspecialcharsbx($filter['filter_path']) ?>">
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("MURL_FILTER_SITE") ?>:</td>
		<td>
			<?= CLang::SelectBox("filter_site_id", $filter['filter_site_id']) ?>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("MURL_USL") ?>:</td>
		<td>
			<input type="text" name="filter_condition" size="50" value="<?= htmlspecialcharsbx($filter['filter_condition']) ?>">
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("MURL_COMPONENT") ?>:</td>
		<td>
			<input type="text" name="filter_id" size="50" value="<?= htmlspecialcharsbx($filter['filter_id']) ?>">
		</td>
	</tr>
<?php
$oFilter->Buttons(
	array(
		"table_id" => $sTableID,
		"url" => $APPLICATION->GetCurPage(),
		"form" => "find_form"
	)
);
$oFilter->End();
?>
</form>
<?php
// место для вывода списка
$lAdmin->DisplayList();

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
