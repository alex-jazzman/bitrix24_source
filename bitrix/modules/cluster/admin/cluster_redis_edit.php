<?php
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/cluster/prolog.php");
IncludeModuleLangFile(__FILE__);

if (!$USER->IsAdmin())
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

$arServer = CClusterRedis::getByID($_REQUEST["ID"]);

$group_id = intval($_REQUEST["group_id"]);
if (is_array($arServer) && $arServer["GROUP_ID"] != $group_id)
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

$aTabs = [[
	"DIV" => "edit1",
	"TAB" => GetMessage("CLU_REDIS_EDIT_TAB"),
	"ICON"=>"main_user_edit",
	"TITLE"=>GetMessage("CLU_REDIS_EDIT_TAB_TITLE"),
]];
$tabControl = new CAdminTabControl("tabControl", $aTabs);

$ID = intval($_REQUEST["ID"]); // Id of the edited record
$strError = "";
$bVarsFromForm = false;
$cacheType = COption::GetOptionString('cluster', 'cache_type', 'memcache');
if (!extension_loaded('redis')  || $cacheType != 'redis')
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	if ($cacheType != 'redis')
	{
		ShowError(GetMessage("CLU_REDIS_DISABLED"));
	}
	else
	{
		ShowError(GetMessage("CLU_REDIS_NO_EXTENTION"));
	}
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && check_bitrix_sessid())
{
	if ((isset($_REQUEST["save"]) && $_REQUEST["save"] != "") || (isset($_REQUEST["apply"]) && $_REQUEST["apply"] != ""))
	{
		$ob = new CClusterRedis;
		$arFields = [
			"GROUP_ID" => $group_id,
			"HOST" => $_POST["HOST"],
			"PORT" => $_POST["PORT"],
		];

		if (is_array($arServer))
		{
			$res = $ob->update($arServer["ID"], $arFields);
		}
		else
		{
			$res = $ob->add($arFields);
		}

		if ($res)
		{
			if(isset($_REQUEST["apply"]) && $_REQUEST["apply"] != "")
				LocalRedirect("/bitrix/admin/cluster_redis_edit.php?ID=".$res."&lang=".LANGUAGE_ID.'&group_id='.$group_id."&".$tabControl->ActiveTabParam());
			else
				LocalRedirect("/bitrix/admin/cluster_redis_list.php?lang=".LANGUAGE_ID.'&group_id='.$group_id);
		}
		else
		{
			if ($e = $APPLICATION->GetException())
				$message = new CAdminMessage(GetMessage("CLU_REDIS_EDIT_SAVE_ERROR"), $e);
			$bVarsFromForm = true;
		}
	}
}

ClearVars("str_");

if($bVarsFromForm)
{
	$str_HOST = htmlspecialcharsbx($_REQUEST["HOST"]);
	$str_PORT = intval($_REQUEST["PORT"]);
}
elseif(is_array($arServer))
{
	$str_HOST = htmlspecialcharsbx($arServer["HOST"]);
	$str_PORT = intval($arServer["PORT"]);
}
else
{
	$str_HOST = "";
	$str_PORT = "6379";
	if (!CCluster::checkForServers(1))
	{
		$message = new CAdminMessage(["MESSAGE" => GetMessage("CLUSTER_SERVER_COUNT_WARNING"), "TYPE" => "ERROR"]);
	}
}

$APPLICATION->SetTitle(is_array($arServer)? GetMessage("CLU_REDIS_EDIT_EDIT_TITLE"): GetMessage("CLU_REDIS_EDIT_NEW_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$arRedisServers = CClusterRedis::loadConfig();

$aMenu = [[
	"TEXT" => GetMessage("CLU_REDIS_EDIT_MENU_LIST"),
	"TITLE" => GetMessage("CLU_REDIS_EDIT_MENU_LIST_TITLE"),
	"LINK" => "cluster_redis_list.php?lang=".LANGUAGE_ID.'&group_id='.$group_id,
	"ICON" => "btn_list",
]];

$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($message)
{
	echo $message->Show();
}

?><form method="POST" action="<?echo $APPLICATION->GetCurPage()?>"  enctype="multipart/form-data" name="editform" id="editform"><?
		$tabControl->Begin();
		$tabControl->BeginNextTab();

		if (is_array($arServer)):
			?><tr><?
				?><td><?=GetMessage("CLU_REDIS_EDIT_ID")?>:</td><?
				?><td><?=intval($arServer["ID"]);?></td><?
			?></tr><?
		endif;

		?><tr><?
			?><td width="40%"><?=GetMessage("CLU_REDIS_EDIT_HOST")?>:</td><?
			?><td width="60%"><input type="text" size="20" name="HOST" value="<?=$str_HOST?>"></td><?
		?></tr><tr><?
			?><td><?=GetMessage("CLU_REDIS_EDIT_PORT")?>:</td><?
			?><td><input type="text" size="6" name="PORT" value="<?=$str_PORT?>"></td><?
		?></tr><?

		$tabControl->Buttons(["back_url"=>"cluster_redis_list.php?lang=".LANGUAGE_ID."&group_id=".$group_id,]);
		echo bitrix_sessid_post();
		?><input type="hidden" name="lang" value="<?=LANGUAGE_ID?>"><?
		?><input type="hidden" name="group_id" value="<?=$group_id?>"><?

		if (is_array($arServer)):
			?><input type="hidden" name="ID" value="<?=intval($arServer["ID"])?>"><?
		endif;

		$tabControl->End();
	?></form><?

$tabControl->ShowWarnings("editform", $message);
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>