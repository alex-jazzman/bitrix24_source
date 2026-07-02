<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * Bitrix vars
 *
 * @global CMain $APPLICATION
 * @global CUser $USER
 */

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

if(!$USER->CanDoOperation('view_event_log'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

IncludeModuleLangFile(__FILE__);

$bStatistic = CModule::IncludeModule('statistic');

$arAuditTypes = CEventLog::GetEventTypes();

$sTableID = "tbl_event_log";
$oSort = new CAdminSorting($sTableID, "ID", "DESC");
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilterFields = array(
	"find",
	"find_type",
	"find_id",
	"find_timestamp_x_1",
	"find_timestamp_x_2",
	"find_severity",
	"find_audit_type_id",
	"find_audit_type",
	"find_module_id",
	"find_item_id",
	"find_site_id",
	"find_user_id",
	"find_guest_id",
	"find_remote_addr",
	"find_user_agent",
	"find_request_uri",
);
function CheckFilter($filter)
{
	$str = "";
	if (!empty($filter["find_timestamp_x_1"]))
	{
		if(!CheckDateTime($filter["find_timestamp_x_1"], CSite::GetDateFormat("FULL")))
			$str.= GetMessage("MAIN_EVENTLOG_WRONG_TIMESTAMP_X_FROM")."<br>";
	}
	if (!empty($filter["find_timestamp_x_2"]))
	{
		if(!CheckDateTime($filter["find_timestamp_x_2"], CSite::GetDateFormat("FULL")))
			$str.= GetMessage("MAIN_EVENTLOG_WRONG_TIMESTAMP_X_TO")."<br>";
	}

	if($str <> '')
	{
		global $lAdmin;
		$lAdmin->AddFilterError($str);
		return false;
	}

	return true;
}

$arFilter = array();
$filter = $lAdmin->InitFilter($arFilterFields);

if(CheckFilter($filter))
{
	if(is_array($filter['find_severity']) && $filter['find_severity'][0] == "NOT_REF")
		$filter['find_severity'] = "";

	if(is_array($filter['find_audit_type']) && $filter['find_audit_type'][0] == "NOT_REF")
	{
		$audit_type_id_op = "=";
		$audit_type_id_filter = false;
	}
	elseif($filter['find_type'] == "audit_type_id" && $filter['find'] != '')
	{
		$audit_type_id_op = "";
		$audit_type_id_filter = $filter['find'];
	}
	elseif(is_array($filter['find_audit_type']))
	{
		$audit_type_id_op = "=";
		$audit_type_id_filter = $filter['find_audit_type'];
	}
	else
	{
		$audit_type_id_op = "";
		$audit_type_id_filter = $filter['find_audit_type'];
	}

	if(!is_array($audit_type_id_filter) && mb_strlen($filter['find_audit_type_id']))
	{
		$audit_type_id_op = "";
		$audit_type_id_filter = "(".$audit_type_id_filter.")|(".$filter['find_audit_type_id'].")";
	}

	$arFilter = array(
		"ID" => $filter['find_id'],
		"TIMESTAMP_X_1" => $filter['find_timestamp_x_1'],
		"TIMESTAMP_X_2" => $filter['find_timestamp_x_2'],
		"SEVERITY" => (is_array($filter['find_severity']) && !empty($filter['find_severity']) ? implode("|", $filter['find_severity']) : ""),
		$audit_type_id_op."AUDIT_TYPE_ID" => $audit_type_id_filter,
		"MODULE_ID" => $filter['find_module_id'],
		"ITEM_ID" => $filter['find_item_id'],
		"SITE_ID" => $filter['find_site_id'],
		"USER_ID" => ($filter['find'] != '' && $filter['find_type'] == "user_id" ? $filter['find'] : $filter['find_user_id']),
		"GUEST_ID" => $filter['find_guest_id'],
		"REMOTE_ADDR" => ($filter['find'] != '' && $filter['find_type'] == "remote_addr" ? $filter['find'] : $filter['find_remote_addr']),
		"REQUEST_URI" => $filter['find_request_uri'],
		"USER_AGENT" => ($filter['find'] != '' && $filter['find_type'] == "user_agent" ? $filter['find'] : $filter['find_user_agent']),
	);
}

if(isset($_REQUEST["mode"]) && $_REQUEST["mode"] == "excel")
	$arNavParams = false;
else
	$arNavParams = array("nPageSize"=>CAdminResult::GetNavSize($sTableID));

$rsData = CEventLog::GetList(array($oSort->getField() => $oSort->getOrder()), $arFilter, $arNavParams);
$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();
$lAdmin->NavText($rsData->GetNavPrint(GetMessage("MAIN_EVENTLOG_LIST_PAGE")));

$arHeaders = array(
	array(
		"id" => "ID",
		"content" => GetMessage("MAIN_EVENTLOG_ID"),
		"sort" => "ID",
		"default" => true,
		"align" => "right",
	),
	array(
		"id" => "TIMESTAMP_X",
		"content" => GetMessage("MAIN_EVENTLOG_TIMESTAMP_X"),
		"sort" => "TIMESTAMP_X",
		"default" => true,
		"align" => "right",
	),
	array(
		"id" => "SEVERITY",
		"content" => GetMessage("MAIN_EVENTLOG_SEVERITY"),
	),
	array(
		"id" => "AUDIT_TYPE_ID",
		"content" => GetMessage("MAIN_EVENTLOG_AUDIT_TYPE_ID"),
		"default" => true,
	),
	array(
		"id" => "MODULE_ID",
		"content" => GetMessage("MAIN_EVENTLOG_MODULE_ID"),
	),
	array(
		"id" => "ITEM_ID",
		"content" => GetMessage("MAIN_EVENTLOG_ITEM_ID"),
		"default" => true,
	),
	array(
		"id" => "REMOTE_ADDR",
		"content" => GetMessage("MAIN_EVENTLOG_REMOTE_ADDR"),
		"default" => true,
	),
	array(
		"id" => "USER_AGENT",
		"content" => GetMessage("MAIN_EVENTLOG_USER_AGENT"),
	),
	array(
		"id" => "REQUEST_URI",
		"content" => GetMessage("MAIN_EVENTLOG_REQUEST_URI"),
		"default" => true,
	),
	array(
		"id" => "SITE_ID",
		"content" => GetMessage("MAIN_EVENTLOG_SITE_ID"),
	),
	array(
		"id" => "USER_ID",
		"content" => GetMessage("MAIN_EVENTLOG_USER_ID"),
		"default" => true,
	),
	array(
		"id" => "DESCRIPTION",
		"content" => GetMessage("MAIN_EVENTLOG_DESCRIPTION"),
		"default" => true,
	),
);
if($bStatistic)
	$arHeaders[] = array(
		"id" => "GUEST_ID",
		"content" => GetMessage("MAIN_EVENTLOG_GUEST_ID"),
	);

$lAdmin->AddHeaders($arHeaders);

$arUsersCache = array();
$arGroupsCache = array();
$arForumCache = array("FORUM" => array(), "TOPIC" => array(), "MESSAGE" => array());
while($db_res = $rsData->Fetch())
{
	$row = $lAdmin->AddRow($db_res["ID"], $db_res);
	$row->AddViewField("AUDIT_TYPE_ID", array_key_exists($db_res["AUDIT_TYPE_ID"], $arAuditTypes) ? preg_replace("/^\[.*?]\s+/", "", $arAuditTypes[$db_res["AUDIT_TYPE_ID"]]) : htmlspecialcharsbx($db_res["AUDIT_TYPE_ID"]));
	if($bStatistic && mb_strlen($db_res["GUEST_ID"]))
	{
		$row->AddViewField("GUEST_ID", '<a href="/bitrix/admin/hit_list.php?lang='.LANGUAGE_ID.'&amp;set_filter=Y&amp;find_guest_id='.htmlspecialcharsbx($db_res["GUEST_ID"]).'&amp;find_guest_id_exact_match=Y">'.htmlspecialcharsbx($db_res["GUEST_ID"]).'</a>');
	}
	if($db_res["USER_ID"])
	{
		if(!array_key_exists($db_res["USER_ID"], $arUsersCache))
		{
			$rsUser = CUser::GetByID($db_res["USER_ID"]);
			if($arUser = $rsUser->GetNext())
			{
				$arUser["FULL_NAME"] = $arUser["NAME"].($arUser["NAME"] == '' || $arUser["LAST_NAME"] == ''?"":" ").$arUser["LAST_NAME"];
			}
			$arUsersCache[$db_res["USER_ID"]] = $arUser;
		}
		if($arUsersCache[$db_res["USER_ID"]])
			$row->AddViewField("USER_ID", '[<a href="user_edit.php?lang='.LANGUAGE_ID.'&ID='.htmlspecialcharsbx($db_res["USER_ID"]).'">'.htmlspecialcharsbx($db_res["USER_ID"]).'</a>] '.$arUsersCache[$db_res["USER_ID"]]["FULL_NAME"]);
	}
	if($db_res["ITEM_ID"])
	{
		switch($db_res["AUDIT_TYPE_ID"])
		{
		case "USER_AUTHORIZE":
		case "USER_LOGOUT":
		case "USER_REGISTER":
		case "USER_INFO":
		case "USER_PASSWORD_CHANGED":
		case "USER_DELETE":
		case "USER_GROUP_CHANGED":
		case "USER_EDIT":
		case "USER_BLOCKED":
		case "USER_PERMISSIONS_FAIL":
		case "SECURITY_OTP":
			if(!array_key_exists($db_res["ITEM_ID"], $arUsersCache))
			{
				$rsUser = CUser::GetByID($db_res["ITEM_ID"]);
				if($arUser = $rsUser->GetNext())
				{
					$arUser["FULL_NAME"] = $arUser["NAME"].($arUser["NAME"] == '' || $arUser["LAST_NAME"] == ''?"":" ").$arUser["LAST_NAME"];
				}
				$arUsersCache[$db_res["ITEM_ID"]] = $arUser;
			}
			if($arUsersCache[$db_res["ITEM_ID"]])
				$row->AddViewField("ITEM_ID", '[<a href="user_edit.php?lang='.LANGUAGE_ID.'&amp;ID='.htmlspecialcharsbx($db_res["ITEM_ID"]).'">'.htmlspecialcharsbx($db_res["ITEM_ID"]).'</a>] '.$arUsersCache[$db_res["ITEM_ID"]]["FULL_NAME"]);
			break;
		case "GROUP_POLICY_CHANGED":
		case "MODULE_RIGHTS_CHANGED":
		case "GROUP_ADDED":
		case "GROUP_UPDATED":
			if(!array_key_exists($db_res["ITEM_ID"], $arGroupsCache))
			{
				$rsGroup = CGroup::GetByID($db_res["ITEM_ID"]);
				if($arGroup = $rsGroup->GetNext())
					$arGroupsCache[$db_res["ITEM_ID"]] = $arGroup["NAME"];
				else
					$arGroupsCache[$db_res["ITEM_ID"]] = "";
			}
			$row->AddViewField("ITEM_ID", '[<a href="group_edit.php?lang='.LANGUAGE_ID.'&amp;ID='.htmlspecialcharsbx($db_res["ITEM_ID"]).'">'.htmlspecialcharsbx($db_res["ITEM_ID"]).'</a>] '.$arGroupsCache[$db_res["ITEM_ID"]]);
			break;
		case "TASK_CHANGED":
			$rsTask = CTask::GetByID($db_res["ITEM_ID"]);
			if($arTask = $rsTask->GetNext())
				$row->AddViewField("ITEM_ID", '[<a href="task_edit.php?lang='.LANGUAGE_ID.'&amp;ID='.htmlspecialcharsbx($db_res["ITEM_ID"]).'">'.htmlspecialcharsbx($db_res["ITEM_ID"]).'</a>] '.$arTask["NAME"]);
			break;
		case "FORUM_MESSAGE_APPROVE":
		case "FORUM_MESSAGE_UNAPPROVE":
		case "FORUM_MESSAGE_MOVE":
		case "FORUM_MESSAGE_EDIT":
			if (intval($db_res["ITEM_ID"]) <= 0):
				break;
			elseif (!array_key_exists($db_res["ITEM_ID"], $arForumCache["MESSAGE"])):
				CModule::IncludeModule("forum");
				$res = CForumMessage::GetByID($db_res["ITEM_ID"]);
				$res["MESSAGE_ID"] = $res["ID"];
				$arForumCache["MESSAGE"][$db_res["ITEM_ID"]] = $res;
			else:
				$res = $arForumCache["MESSAGE"][$db_res["ITEM_ID"]];
			endif;
			if (!array_key_exists($res["FORUM_ID"], $arForumCache["FORUM"])):
				$arForumCache["FORUM"][$res["FORUM_ID"]] = CForumNew::GetByID($res["FORUM_ID"]);
				if ($arForumCache["FORUM"][$res["FORUM_ID"]]):
					$arSitesPath = CForumNew::GetSites($res["FORUM_ID"]);
					$arForumCache["FORUM"][$res["FORUM_ID"]]["PATH"] = array_shift($arSitesPath);
				endif;
			endif;
			if ($arForumCache["FORUM"][$res["FORUM_ID"]]["PATH"]):
				$sPath = CForumNew::PreparePath2Message($arForumCache["FORUM"][$res["FORUM_ID"]]["PATH"], $res);
				$row->AddViewField("ITEM_ID", '[<a href="'.$sPath.'">'.htmlspecialcharsbx($db_res["ITEM_ID"]).'</a>] '.GetMessage("MAIN_EVENTLOG_FORUM_MESSAGE"));
			else:
				$row->AddViewField("ITEM_ID", '['.htmlspecialcharsbx($db_res["ITEM_ID"]).'] '.GetMessage("MAIN_EVENTLOG_FORUM_MESSAGE"));
			endif;
			break;
		case "FORUM_TOPIC_APPROVE":
		case "FORUM_TOPIC_UNAPPROVE":
		case "FORUM_TOPIC_STICK":
		case "FORUM_TOPIC_UNSTICK":
		case "FORUM_TOPIC_OPEN":
		case "FORUM_TOPIC_CLOSE":
		case "FORUM_TOPIC_MOVE":
		case "FORUM_TOPIC_EDIT":
			if (intval($db_res["ITEM_ID"]) <= 0):
				break;
			elseif (!array_key_exists($db_res["ITEM_ID"], $arForumCache["TOPIC"])):
				CModule::IncludeModule("forum");
				$res = CForumTopic::GetByID($db_res["ITEM_ID"]);
				$res["MESSAGE_ID"] = $res["LAST_MESSAGE_ID"];
				$res["TOPIC_ID"] = $res["ID"];
				$arForumCache["TOPIC"][$db_res["ITEM_ID"]] = $res;
			else:
				$res = $arForumCache["TOPIC"][$db_res["ITEM_ID"]];
			endif;
			if (!array_key_exists($res["FORUM_ID"], $arForumCache["FORUM"])):
				$arForumCache["FORUM"][$res["FORUM_ID"]] = CForumNew::GetByID($res["FORUM_ID"]);
				if ($arForumCache["FORUM"][$res["FORUM_ID"]]):
					$arSitesPath = CForumNew::GetSites($res["FORUM_ID"]);
					$arForumCache["FORUM"][$res["FORUM_ID"]]["PATH"] = array_shift($arSitesPath);
				endif;
			endif;
			if ($arForumCache["FORUM"][$res["FORUM_ID"]]["PATH"]):
				$sPath = CForumNew::PreparePath2Message($arForumCache["FORUM"][$res["FORUM_ID"]]["PATH"], $res);
				$row->AddViewField("ITEM_ID", '[<a href="'.$sPath.'">'.htmlspecialcharsbx($db_res["ITEM_ID"]).'</a>] '.GetMessage("MAIN_EVENTLOG_FORUM_TOPIC"));
			else:
				$row->AddViewField("ITEM_ID", '['.htmlspecialcharsbx($db_res["ITEM_ID"]).'] '.GetMessage("MAIN_EVENTLOG_FORUM_TOPIC"));
			endif;
			break;
		case "FORUM_MESSAGE_DELETE":
			$row->AddViewField("ITEM_ID", '['.htmlspecialcharsbx($db_res["ITEM_ID"]).'] '.GetMessage("MAIN_EVENTLOG_FORUM_MESSAGE"));
			break;
		case "FORUM_TOPIC_DELETE":
			$row->AddViewField("ITEM_ID", '['.htmlspecialcharsbx($db_res["ITEM_ID"]).'] '.GetMessage("MAIN_EVENTLOG_FORUM_TOPIC"));
			break;
		case "IBLOCK_SECTION_ADD":
		case "IBLOCK_SECTION_EDIT":
		case "IBLOCK_SECTION_DELETE":
		case "IBLOCK_ELEMENT_ADD":
		case "IBLOCK_ELEMENT_EDIT":
		case "IBLOCK_ELEMENT_DELETE":
		case "IBLOCK_ADD":
		case "IBLOCK_EDIT":
		case "IBLOCK_DELETE":
			$itemIdHtml = htmlspecialcharsbx($db_res["ITEM_ID"]);
			$elementLink = CIBlock::GetAdminElementListLink($db_res["ITEM_ID"], array('filter_section'=>-1));
			parse_str($elementLink, $elementInfo);
			if (empty($elementInfo["type"]))
			{
				$itemIdHtml = GetMessage("MAIN_EVENTLOG_IBLOCK_DELETE");
			}
			else
			{
				if(CModule::IncludeModule('iblock'))
					$itemIdHtml = '<a href="'.htmlspecialcharsbx($elementLink).'">'.$itemIdHtml.'</a>';
			}

			$row->AddViewField("ITEM_ID", '['.$itemIdHtml.'] '.GetMessage("MAIN_EVENTLOG_IBLOCK"));
			break;
		}
	}
	if($db_res["REQUEST_URI"] <> '')
	{
		$row->AddViewField("REQUEST_URI", htmlspecialcharsbx($db_res["REQUEST_URI"]));
	}
	if($db_res["DESCRIPTION"] <> '')
	{
		if(strncmp("==", $db_res["DESCRIPTION"], 2) === 0)
		{
			$DESCRIPTION = htmlspecialcharsbx(base64_decode(mb_substr($db_res["DESCRIPTION"], 2)));
		}
		else
		{
			$DESCRIPTION = htmlspecialcharsbx($db_res["DESCRIPTION"]);
		}
		//htmlspecialcharsback for <br> <BR> <br/>
		$DESCRIPTION = preg_replace("#(&lt;)(\\s*br\\s*/{0,1})(&gt;)#is", "<\\2>", $DESCRIPTION);
		$row->AddViewField("DESCRIPTION", $DESCRIPTION);
	}
	if($bStatistic && $db_res["REMOTE_ADDR"])
	{
		$arr = explode(".", $db_res["REMOTE_ADDR"]);
		if(count($arr)==4)
		{
			$row->AddViewField("REMOTE_ADDR", htmlspecialcharsbx($db_res["REMOTE_ADDR"]).'<br><a href="stoplist_edit.php?lang='.LANGUAGE_ID.'&amp;net1='.intval($arr[0]).'&amp;net2='.intval($arr[1]).'&amp;net3='.intval($arr[2]).'&amp;net4='.intval($arr[3]).'">['.GetMessage("MAIN_EVENTLOG_STOP_LIST").']<a>');
		}
	}
}

$aContext = array(
	array(
		"TEXT"	=> GetMessage("eventlog_notifications"),
		"LINK"	=> "log_notifications.php?lang=".LANGUAGE_ID,
		"TITLE"	=> GetMessage("eventlog_notifications_title"),
	),
);
$lAdmin->AddAdminContextMenu($aContext);

$APPLICATION->SetTitle(GetMessage("MAIN_EVENTLOG_PAGE_TITLE"));
$lAdmin->CheckListMode();

require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");
?>
<form name="find_form" method="GET" action="<?= $APPLICATION->GetCurPage()?>?">
<input type="hidden" name="lang" value="<?= LANGUAGE_ID?>">
<?php
$arFilterNames = array(
	"find_id" => GetMessage("MAIN_EVENTLOG_ID"),
	"find_timestamp_x" => GetMessage("MAIN_EVENTLOG_TIMESTAMP_X"),
	"find_severity" => GetMessage("MAIN_EVENTLOG_SEVERITY"),
	"find_audit_type_id" => GetMessage("MAIN_EVENTLOG_AUDIT_TYPE_ID"),
	"find_module_id" => GetMessage("MAIN_EVENTLOG_MODULE_ID"),
	"find_item_id" => GetMessage("MAIN_EVENTLOG_ITEM_ID"),
	"find_site_id" => GetMessage("MAIN_EVENTLOG_SITE_ID"),
	"find_user_id" => GetMessage("MAIN_EVENTLOG_USER_ID"),
	"find_guest_id" => GetMessage("MAIN_EVENTLOG_GUEST_ID"),
	"find_remote_addr" => GetMessage("MAIN_EVENTLOG_REMOTE_ADDR"),
	"find_user_agent" => GetMessage("MAIN_EVENTLOG_USER_AGENT"),
	"find_request_uri" => GetMessage("MAIN_EVENTLOG_REQUEST_URI"),
);
if(!$bStatistic)
	unset($arFilterNames["find_guest_id"]);

$oFilter = new CAdminFilter($sTableID."_filter", $arFilterNames);
$oFilter->Begin();
?>
<tr>
	<td><b><?= GetMessage("MAIN_EVENTLOG_SEARCH")?>:</b></td>
	<td nowrap>
		<input type="text" size="25" name="find" value="<?= htmlspecialcharsbx($filter['find'])?>">
		<select name="find_type">
			<option value="audit_type_id"<?php if($filter['find_type']=="audit_type_id") echo " selected"?>><?= GetMessage("MAIN_EVENTLOG_AUDIT_TYPE_ID")?></option>
			<option value="user_id"<?php if($filter['find_type']=="user_id") echo " selected"?>><?= GetMessage("MAIN_EVENTLOG_USER_ID")?></option>
			<option value="remote_addr"<?php if($filter['find_type']=="remote_addr") echo " selected"?>><?= GetMessage("MAIN_EVENTLOG_REMOTE_ADDR")?></option>
			<option value="user_agent"<?php if($filter['find_type']=="user_agent") echo " selected"?>><?= GetMessage("MAIN_EVENTLOG_USER_AGENT")?></option>
		</select>
	</td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_ID")?>:</td>
	<td><input type="text" name="find_id" size="47" value="<?= htmlspecialcharsbx($filter['find_id'])?>"></td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_TIMESTAMP_X")?>:</td>
	<td><?= CAdminCalendar::CalendarPeriod("find_timestamp_x_1", "find_timestamp_x_2", $filter['find_timestamp_x_1'], $filter['find_timestamp_x_2'], false, 15, true)?></td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_SEVERITY")?>:</td>
	<td><?php
		$severity = [
			CEventLog::SEVERITY_SECURITY,
			CEventLog::SEVERITY_EMERGENCY,
			CEventLog::SEVERITY_ALERT,
			CEventLog::SEVERITY_CRITICAL,
			CEventLog::SEVERITY_ERROR,
			CEventLog::SEVERITY_WARNING,
			CEventLog::SEVERITY_NOTICE,
			CEventLog::SEVERITY_INFO,
			CEventLog::SEVERITY_DEBUG,
			'UNKNOWN',
		];
		echo SelectBoxMFromArray("find_severity[]", array(
			"REFERENCE" => $severity,
			"REFERENCE_ID" => $severity,
		), $filter['find_severity'], GetMessage("MAIN_ALL"))?></td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_AUDIT_TYPE_ID")?>:</td>
	<td>
		<input type="text" name="find_audit_type_id" size="47" value="<?= htmlspecialcharsbx($filter['find_audit_type_id'])?>">&nbsp;<?=ShowFilterLogicHelp()?><br>
		<?= SelectBoxMFromArray("find_audit_type[]", array("reference"=>array_values($arAuditTypes),"reference_id"=>array_keys($arAuditTypes)), $filter['find_audit_type'], GetMessage("MAIN_ALL"), "");?>
	</td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_MODULE_ID")?>:</td>
	<td><input type="text" name="find_module_id" size="47" value="<?= htmlspecialcharsbx($filter['find_module_id'])?>">&nbsp;<?=ShowFilterLogicHelp()?></td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_ITEM_ID")?>:</td>
	<td><input type="text" name="find_item_id" size="47" value="<?= htmlspecialcharsbx($filter['find_item_id'])?>">&nbsp;<?=ShowFilterLogicHelp()?></td>
</tr>
<?php
$arSiteDropdown = array("reference" => array(), "reference_id" => array());
$rs = CSite::GetList();
while ($ar = $rs->Fetch())
{
	$arSiteDropdown["reference_id"][] = $ar["ID"];
	$arSiteDropdown["reference"][]    = "[".$ar["ID"]."] ".$ar["NAME"];
}
?>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_SITE_ID")?>:</td>
	<td><?= SelectBoxFromArray("find_site_id", $arSiteDropdown, $filter['find_site_id'], GetMessage("MAIN_ALL"), "");?></td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_USER_ID")?>:</td>
	<td><input type="text" name="find_user_id" size="47" value="<?= htmlspecialcharsbx($filter['find_user_id'])?>"></td>
</tr>
<?php if($bStatistic):?>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_GUEST_ID")?>:</td>
	<td><input type="text" name="find_guest_id" size="47" value="<?= htmlspecialcharsbx($filter['find_guest_id'])?>"></td>
</tr>
<?php endif?>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_REMOTE_ADDR")?>:</td>
	<td><input type="text" name="find_remote_addr" size="47" value="<?= htmlspecialcharsbx($filter['find_remote_addr'])?>">&nbsp;<?=ShowFilterLogicHelp()?></td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_USER_AGENT")?>:</td>
	<td><input type="text" name="find_user_agent" size="47" value="<?= htmlspecialcharsbx($filter['find_user_agent'])?>">&nbsp;<?=ShowFilterLogicHelp()?></td>
</tr>
<tr>
	<td><?= GetMessage("MAIN_EVENTLOG_REQUEST_URI")?>:</td>
	<td><input type="text" name="find_request_uri" size="47" value="<?= htmlspecialcharsbx($filter['find_request_uri'])?>">&nbsp;<?=ShowFilterLogicHelp()?></td>
</tr>
<?php
$oFilter->Buttons(array("table_id"=>$sTableID, "url"=>$APPLICATION->GetCurPage(), "form"=>"find_form"));
$oFilter->End();
?>
</form>
<?php

$lAdmin->DisplayList();

require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
?>
