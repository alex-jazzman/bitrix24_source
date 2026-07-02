<?php
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

/**
 * @global CMain $APPLICATION
 * @global CUser $USER
 */

if(!$USER->CanDoOperation('edit_other_settings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

IncludeModuleLangFile(__FILE__); 

$sTableID = "tbl_smile_set";

$oSort = new CAdminSorting($sTableID, "ID", "asc");
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilter = array();
if ($arID = $lAdmin->GroupAction())
{
	foreach ($arID as $ID)
	{
		if ($ID == '')
			continue;

		if (isset($_REQUEST['action']) && $_REQUEST['action'] == 'delete')
		{
			$arSmileSet = CSmileSet::getById($ID);
			if (!in_array($arSmileSet["STRING_ID"], Array('bitrix_main')))
			{
				CSmileSet::delete($ID);
			}
		}
	}
}
if($lAdmin->EditAction())
{
	foreach($_POST['FIELDS'] as $ID=>$arFields)
	{
		$ID = intval($ID);
		if($ID <= 0)
			continue;

		CSmileSet::update($ID, Array(
			'LANG' => Array(
				LANGUAGE_ID => $arFields['NAME']
			),
			'STRING_ID' => $arFields['STRING_ID'],
			'SORT' => $arFields['SORT'],
		));
	}
}

if (isset($_REQUEST['GALLERY_ID']))
{
	$arFilter['PARENT_ID'] = intval($_REQUEST['GALLERY_ID']);
}
else
{
	LocalRedirect("smile_gallery.php?lang=".LANGUAGE_ID);
}

$dbResultList = CSmileSet::getList(Array(
	'SELECT' => Array('ID', 'STRING_ID', 'NAME', 'SORT', 'SMILE_COUNT'),
	'FILTER' => $arFilter,
	'ORDER' => array($oSort->getField() => $oSort->getOrder()),
	'NAV_PARAMS' => array("nPageSize"=>CAdminResult::GetNavSize($sTableID)),
	'RETURN_RES' => 'Y'
));

$dbResultList = new CAdminResult($dbResultList, $sTableID);
$dbResultList->NavStart();

$lAdmin->NavText($dbResultList->GetNavPrint(GetMessage("SMILE_NAV")));

$lAdmin->AddHeaders(array(
	array("id"=>"ID", "content"=>GetMessage("SMILE_ID"), "sort"=>"ID", "default"=>false),
	array("id"=>"NAME", "content"=>GetMessage("SMILE_NAME"), "default"=>true),
	array("id"=>"STRING_ID", "content"=>GetMessage("SMILE_STRING_ID"), "default"=>false),
	array("id"=>"SORT","content"=>GetMessage("SMILE_SORT"), "sort"=>"SORT", "default"=>true, "align"=>"right"),
	array("id"=>"SMILE_COUNT","content"=>GetMessage("SMILE_SMILE_COUNT"), "sort"=>"SMILE_COUNT", "default"=>true),
));

$arVisibleColumns = $lAdmin->GetVisibleHeaderColumns();

while ($arForum = $dbResultList->Fetch())
{
	$setId = (int)$arForum["ID"];
	$setIdHtml = htmlspecialcharsbx($arForum["ID"]);
	$setNameHtml = htmlspecialcharsbx($arForum["NAME"]);
	$stringIdHtml = htmlspecialcharsbx($arForum["STRING_ID"]);
	$sortHtml = htmlspecialcharsbx($arForum["SORT"]);
	$smileCountHtml = htmlspecialcharsbx($arForum["SMILE_COUNT"]);
	$row = $lAdmin->AddRow($setId, $arForum);

	$row->AddField("ID", $setIdHtml);
	$row->AddField("SORT", $sortHtml);
	$row->AddViewField("NAME", '<a title="'.GetMessage("SMILE_EDIT_DESCR").'" href="'."smile.php?SET_ID=".$setIdHtml."&lang=".LANGUAGE_ID."&".GetFilterParams("filter_").'">'.($arForum["NAME"] <> '' ? $setNameHtml : GetMessage('SMILE_SET_NAME', Array('#ID#' => $setIdHtml))).'</a>');
	$row->AddViewField("SMILE_COUNT", $smileCountHtml);

	$row->AddInputField("NAME", array("size"=>20));
	$row->AddInputField("STRING_ID", array("size"=>20));
	$row->AddInputField("SORT", array("size"=>5));

	if (in_array($arForum["STRING_ID"], Array('bitrix_main')))
	{
		$row->AddField("STRING_ID", $stringIdHtml);
		$arActions = Array(
			array("ICON"=>"edit", "TEXT"=>GetMessage("SMILE_EDIT_DESCR"), "ACTION"=>$lAdmin->ActionRedirect("smile_set_edit.php?GALLERY_ID=".$arFilter['PARENT_ID']."&ID=".$setId."&lang=".LANGUAGE_ID."&".GetFilterParams("filter_").""), "DEFAULT"=>true),
		);
	}
	else
	{
		$row->AddInputField("STRING_ID", array("size"=>20));
		$arActions = Array(
			array("ICON"=>"edit", "TEXT"=>GetMessage("SMILE_EDIT_DESCR"), "ACTION"=>$lAdmin->ActionRedirect("smile_set_edit.php?GALLERY_ID=".$arFilter['PARENT_ID']."&ID=".$setId."&lang=".LANGUAGE_ID."&".GetFilterParams("filter_").""), "DEFAULT"=>true),
			array("SEPARATOR" => true),
			array("ICON"=>"delete", "TEXT"=>GetMessage("SMILE_DELETE_DESCR"), "ACTION"=>"if(confirm('".GetMessage('SMILE_DEL_CONF')."')) ".$lAdmin->ActionDoGroup($setId, "delete", "GALLERY_ID=".$arFilter['PARENT_ID']))
		);
	}

	$row->AddActions($arActions);
}


$aContext = array(

	array(
		"TEXT" => GetMessage("SMILE_BTN_BACK"),
		"LINK" => "/bitrix/admin/smile_gallery.php?&lang=".LANGUAGE_ID,
		"ICON" => "btn_list",
	),
	array(
		"TEXT" => GetMessage("SMILE_BTN_ADD_NEW"),
		"LINK" => "smile_set_edit.php?GALLERY_ID=".$arFilter['PARENT_ID']."&lang=".LANGUAGE_ID,
		"TITLE" => GetMessage("SMILE_BTN_ADD_NEW_ALT"),
		"ICON" => "btn_new",
	),
);
$lAdmin->AddAdminContextMenu($aContext);
$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("SMILE_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$lAdmin->DisplayList();

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
