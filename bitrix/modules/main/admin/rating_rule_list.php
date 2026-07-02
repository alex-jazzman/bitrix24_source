<?php
/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 */

require_once(__DIR__."/../include/prolog_admin_before.php");

if(!$USER->CanDoOperation('edit_ratings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

IncludeModuleLangFile(__FILE__);

$sTableID = "tbl_rating_rule";
$oSort = new CAdminSorting($sTableID, "id", "desc");
$lAdmin = new CAdminList($sTableID, $oSort);

$FilterArr = Array(
	"find_name",
	"find_active",
	"find_id",
	"find_entity_type_id",
);

$filter = $lAdmin->InitFilter($FilterArr);

$arFilter = Array(
	"NAME"			 => $filter["find_name"],
	"ACTIVE"		 => $filter["find_active"],
	"ID" 			 => $filter["find_id"],
	"ENTITY_TYPE_ID" => $filter["find_entity_type_id"],
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
		if(!CRatingRule::Update($ID, $arUpdate))
		{
			$e = $APPLICATION->GetException();
			$lAdmin->AddUpdateError(($e? $e->GetString():GetMessage("RATING_RULE_LIST_ERR_EDIT")), $ID);
		}
	}
}

if(($arID = $lAdmin->GroupAction()))
{
	if (isset($_REQUEST['action_target']) && $_REQUEST['action_target']=='selected')
	{
		$rsData = CRatingRule::GetList(array($oSort->getField() => $oSort->getOrder()), $arFilter);
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
			case "reapply":
				if(!CRatingRule::Apply($ID, true))
					$lAdmin->AddGroupError(GetMessage("RATING_RULE_LIST_ERR_APP"), $ID);
			break;
			case "delete":
				if(!CRatingRule::Delete($ID))
					$lAdmin->AddGroupError(GetMessage("RATING_RULE_LIST_ERR_DEL"), $ID);
			break;
		}
	}
}

$rsData = CRatingRule::GetList(array($oSort->getField() => $oSort->getOrder()), $arFilter);
$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();
$lAdmin->NavText($rsData->GetNavPrint(GetMessage("RATING_RULE_LIST_NAV")));

$aHeaders = array(
	array("id"=>"ID", "content"=>"ID", "sort"=>"id", "default"=>true),
	array("id"=>"NAME", "content"=>GetMessage("RATING_RULE_NAME"), "sort"=>"name", "default"=>true),
	array("id"=>"ACTIVE", "content"=>GetMessage("RATING_RULE_ACTIVE"), "sort"=>"active", "default"=>true),
	array("id"=>"CREATED", "content"=>GetMessage("RATING_RULE_CREATED"), "sort"=>"created", "default"=>false),
	array("id"=>"LAST_MODIFIED", "content"=>GetMessage("RATING_RULE_LAST_MODIFIED"), "sort"=>"last_modified", "default"=>true),
	array("id"=>"LAST_APPLIED", "content"=>GetMessage("RATING_RULE_LAST_APPLIED"), "sort"=>"last_applied", "default"=>true),
	array("id"=>"ENTITY_TYPE_ID", "content"=>GetMessage("RATING_RULE_ENTITY_TYPE_ID"), "sort"=>"entity_type_id", "default"=>false),
);

$lAdmin->AddHeaders($aHeaders);

while($arRes = $rsData->Fetch())
{
	$ratingRuleId = (int)$arRes["ID"];
	$row = $lAdmin->AddRow($ratingRuleId, $arRes);
	$row->AddInputField("NAME", array("size"=>20));
	$row->AddViewField("NAME", htmlspecialcharsbx($arRes["NAME"]));
	$row->AddCheckField("ACTIVE", array("size"=>20));
	$row->AddViewField("ACTIVE", $arRes["ACTIVE"] == "Y" ? GetMessage("RATING_RULE_ACTIVE_YES") : GetMessage("RATING_RULE_ACTIVE_NO"));
	$row->AddViewField("LAST_CALCULATED", empty($arRes["LAST_CALCULATED"]) ? GetMessage("RATING_RULE_STATUS_WAITING") : htmlspecialcharsbx($arRes["LAST_CALCULATED"]));

	$arActions = Array(
		array(
			"ICON"=>"edit",
			"DEFAULT"=>true,
			"TEXT"=>GetMessage("RATING_RULE_LIST_EDIT"),
			"ACTION"=>$lAdmin->ActionRedirect("rating_rule_edit.php?ID=".$ratingRuleId)
		),
		array(
			"ICON"=>"edit",
			"TEXT"=>GetMessage("RATING_RULE_LIST_REAPPLY"),
			"ACTION"=>$lAdmin->ActionDoGroup($ratingRuleId, "reapply")
		),
		array(
			"ICON"=>"delete",
			"TEXT"=>GetMessage("RATING_RULE_LIST_DEL"),
			"ACTION"=>"if(confirm('".GetMessage("RATING_RULE_LIST_DEL_CONF")."')) ".$lAdmin->ActionDoGroup($ratingRuleId, "delete")
		),
	);
	$row->AddActions($arActions);
}

$lAdmin->AddGroupActionTable(Array(
	"delete"=>true,
));

$aContext = array(
	array(
		"TEXT"=>GetMessage("RATING_RULE_LIST_ADD"),
		"LINK"=>"rating_rule_edit.php?lang=".LANGUAGE_ID,
		"TITLE"=>GetMessage("RATING_RULE_LIST_ADD_TITLE"),
		"ICON"=>"btn_new",
	),
);
$lAdmin->AddAdminContextMenu($aContext);
$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("MAIN_RATING_RULE_LIST"));
require_once ($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");

$oFilter = new CAdminFilter(
	$sTableID."_filter",
	array(
		GetMessage("RATING_RULE_LIST_FLT_ACTIVE"),
		GetMessage("RATING_RULE_LIST_FLT_ID"),
		GetMessage("RATING_RULE_LIST_FLT_ENTITY_TYPE_ID"),
	)
);
?>
	<form name="form1" method="GET" action="<?=$APPLICATION->GetCurPage()?>">
	<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
<?php $oFilter->Begin();?>
	<tr>
		<td><?= GetMessage("RATING_RULE_LIST_FLT_NAME")?></td>
		<td><input type="text" name="find_name" size="40" value="<?= htmlspecialcharsbx($filter["find_name"])?>"><?=ShowFilterLogicHelp()?></td>
	</tr>
	<tr>
		<td><?= GetMessage("RATING_RULE_LIST_FLT_ACTIVE")?></td>
		<td><select name="find_active">
			<option value=""><?= GetMessage("RATING_RULE_LIST_FLT_ALL")?></option>
			<option value="Y"<?php if($filter["find_active"] == "Y") echo " selected"?>><?= GetMessage("RATING_RULE_LIST_FLT_ACTIVE_Y")?></option>
			<option value="N"<?php if($filter["find_active"] == "N") echo " selected"?>><?= GetMessage("RATING_RULE_LIST_FLT_ACTIVE_N")?></option>
			</select>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("RATING_RULE_LIST_FLT_ID")?></td>
		<td><input type="text" name="find_id" size="13" value="<?= htmlspecialcharsbx($filter["find_id"])?>"></td>
	</tr>
	<tr>
		<td><?= GetMessage("RATING_RULE_LIST_FLT_ENTITY_TYPE_ID")?></td>
		<td><input type="text" name="find_entity_type_id" value="<?= htmlspecialcharsbx($filter["find_entity_type_id"])?>" size="40"><?=ShowFilterLogicHelp()?></td>
	</tr>
<?php
$oFilter->Buttons(array("table_id"=>$sTableID,"url"=>$APPLICATION->GetCurPage(),"form"=>"form1"));
$oFilter->End();
?>
	</form>
<?php
$lAdmin->DisplayList();
require_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
