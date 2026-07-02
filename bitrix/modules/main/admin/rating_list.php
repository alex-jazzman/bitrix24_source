<?php
/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 */

require_once(__DIR__."/../include/prolog_admin_before.php");

if(!$USER->CanDoOperation('edit_ratings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$isAdmin = $USER->CanDoOperation('edit_ratings');

IncludeModuleLangFile(__FILE__);

$sTableID = "tbl_rating";
$oSort = new CAdminSorting($sTableID, "id", "desc");
$lAdmin = new CAdminList($sTableID, $oSort);

$FilterArr = Array(
	"find_name",
	"find_active",
	"find_id",
	"find_entity_id",
);

$filter = $lAdmin->InitFilter($FilterArr);

$arFilter = Array(
	"NAME"		=> $filter["find_name"],
	"ACTIVE"	=> $filter["find_active"],
	"ID"		=> $filter["find_id"],
	"ENTITY_ID"	=> $filter["find_entity_id"],
);

if($lAdmin->EditAction())
{
	foreach($_POST['FIELDS'] as $ID=>$arFields)
	{
		$ID = intval($ID);
		if($ID <= 0)
			continue;
		$arUpdate['NAME'] = $arFields['NAME'];
		$arUpdate['ACTIVE'] = $arFields['ACTIVE'] == 'Y' ? 'Y' : 'N';
		if(!CRatings::Update($ID, $arUpdate))
		{
			$e = $APPLICATION->GetException();
			$lAdmin->AddUpdateError(($e? $e->GetString():GetMessage("RATING_LIST_ERR_EDIT")), $ID);
		}
	}
}

if(($arID = $lAdmin->GroupAction()))
{
	if (isset($_REQUEST['action_target']) && $_REQUEST['action_target']=='selected')
	{
		$rsData = CRatings::GetList(array($oSort->getField() => $oSort->getOrder()), $arFilter);
		while($arRes = $rsData->Fetch())
			$arID[] = $arRes['ID'];
	}

	foreach($arID as $ID)
	{
		$ID = intval($ID);
		if($ID <= 0)
			continue;
		switch($_REQUEST['action'])
		{
			case "recalculate":
				if(!CRatings::Calculate($ID, true))
					$lAdmin->AddGroupError(GetMessage("RATING_LIST_ERR_CAL"), $ID);
			break;
			case "delete":
				if(!CRatings::Delete($ID))
					$lAdmin->AddGroupError(GetMessage("RATING_LIST_ERR_DEL"), $ID);
			break;
		}
	}
}

$rsData = CRatings::GetList(array($oSort->getField() => $oSort->getOrder()), $arFilter);
$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();
$lAdmin->NavText($rsData->GetNavPrint(GetMessage("RATING_LIST_NAV")));

$aHeaders = array(
	array("id"=>"ID", "content"=>"ID", "sort"=>"id", "default"=>true),
	array("id"=>"NAME", "content"=>GetMessage("RATING_NAME"), "sort"=>"name", "default"=>true),
	array("id"=>"ACTIVE", "content"=>GetMessage("RATING_ACTIVE"), "sort"=>"active", "default"=>true),
	array("id"=>"CREATED", "content"=>GetMessage("RATING_CREATED"), "sort"=>"created", "default"=>false),
	array("id"=>"LAST_MODIFIED", "content"=>GetMessage("RATING_LAST_MODIFIED"), "sort"=>"last_modified", "default"=>true),
	array("id"=>"LAST_CALCULATED", "content"=>GetMessage("RATING_LAST_CALCULATED"), "sort"=>"last_calculated", "default"=>true),
	array("id"=>"CALCULATED", "content"=>GetMessage("RATING_STATUS"), "sort"=>"status", "default"=>true),
	array("id"=>"ENTITY_ID", "content"=>GetMessage("RATING_ENTITY_ID"), "sort"=>"entity_id", "default"=>false),
);

$lAdmin->AddHeaders($aHeaders);

while($arRes = $rsData->Fetch())
{
	$ratingId = (int)$arRes["ID"];
	$row = $lAdmin->AddRow($ratingId, $arRes);
	$row->AddInputField("NAME", array("size"=>20));
	$row->AddViewField("NAME", htmlspecialcharsbx($arRes["NAME"]));
	$row->AddViewField("ACTIVE", $arRes["ACTIVE"] == "Y" ? GetMessage("RATING_ACTIVE_YES") : GetMessage("RATING_ACTIVE_NO"));
	$row->AddViewField("LAST_CALCULATED", empty($arRes["LAST_CALCULATED"]) ? GetMessage("RATING_STATUS_WAITING") : htmlspecialcharsbx($arRes["LAST_CALCULATED"]));
	$row->AddViewField("CALCULATED", $arRes["CALCULATED"] != 'N' ? ($arRes["CALCULATED"] == 'C' ? GetMessage("RATING_STATUS_WORKING") : GetMessage("RATING_STATUS_DONE")) : GetMessage("RATING_STATUS_WAITING"));

	$arActions = Array(
		array(
			"ICON"=>"edit",
			"DEFAULT"=>true,
			"TEXT"=>GetMessage("RATING_LIST_EDIT"),
			"ACTION"=>$lAdmin->ActionRedirect("rating_edit.php?ID=".$ratingId)
		),
		array(
			"ICON"=>"edit",
			"TEXT"=>GetMessage("RATING_LIST_RECALCULATE"),
			"ACTION"=>$lAdmin->ActionDoGroup($ratingId, "recalculate")
		),
		array(
			"ICON"=>"delete",
			"TEXT"=>GetMessage("RATING_LIST_DEL"),
			"ACTION"=>"if(confirm('".GetMessage("RATING_LIST_DEL_CONF")."')) ".$lAdmin->ActionDoGroup($ratingId, "delete")
		),
	);
	$row->AddActions($arActions);
}

$lAdmin->AddGroupActionTable(Array(
	"delete"=>true,
));

$aContext = array(
	array(
		"TEXT"=>GetMessage("RATING_LIST_ADD"),
		"LINK"=>"rating_edit.php?lang=".LANGUAGE_ID,
		"TITLE"=>GetMessage("RATING_LIST_ADD_TITLE"),
		"ICON"=>"btn_new",
	),
);
$lAdmin->AddAdminContextMenu($aContext);
$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("MAIN_RATING_LIST"));
require_once ($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");

$oFilter = new CAdminFilter(
	$sTableID."_filter",
	array(
		GetMessage("RATING_LIST_FLT_ACTIVE"),
		GetMessage("RATING_LIST_FLT_ID"),
		GetMessage("RATING_LIST_FLT_ENTITY_ID"),
	)
);
?>
	<form name="form1" method="GET" action="<?=$APPLICATION->GetCurPage()?>">
	<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
<?php $oFilter->Begin();?>
	<tr>
		<td><?= GetMessage("RATING_LIST_FLT_NAME")?></td>
		<td><input type="text" name="find_name" size="40" value="<?= htmlspecialcharsbx($filter["find_name"])?>"><?=ShowFilterLogicHelp()?></td>
	</tr>
	<tr>
		<td><?= GetMessage("RATING_LIST_FLT_ACTIVE")?></td>
		<td><select name="find_active">
			<option value=""><?= GetMessage("RATING_LIST_FLT_ALL")?></option>
			<option value="Y"<?php if($filter["find_active"] == "Y") echo " selected"?>><?= GetMessage("RATING_LIST_FLT_ACTIVE")?></option>
			<option value="N"<?php if($filter["find_active"] == "N") echo " selected"?>><?= GetMessage("RATING_LIST_FLT_INACTIVE")?></option>
			</select>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("RATING_LIST_FLT_ID")?></td>
		<td><input type="text" name="find_id" size="13" value="<?= htmlspecialcharsbx($filter["find_id"])?>"></td>
	</tr>
	<tr>
		<td><?= GetMessage("RATING_LIST_FLT_ENTITY_ID")?></td>
		<td><input type="text" name="find_entity_id" value="<?= htmlspecialcharsbx($filter["find_entity_id"])?>" size="40"><?=ShowFilterLogicHelp()?></td>
	</tr>
<?php
$oFilter->Buttons(array("table_id"=>$sTableID,"url"=>$APPLICATION->GetCurPage(),"form"=>"form1"));
$oFilter->End();
?>
	</form>
<?php
$lAdmin->DisplayList();
require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
