<?php

$module_id = "cluster";
$RIGHT = $APPLICATION->GetGroupRight($module_id);

if ($RIGHT >= "R") :
CModule::IncludeModule($module_id);

IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/options.php");
IncludeModuleLangFile(__FILE__);

$options = [
	["max_slave_delay", GetMessage("CLUSTER_OPTIONS_MAX_SLAVE_DELAY")." ", ["text", 6]],
	["cache_type", GetMessage("CLUSTER_OPTIONS_CACHE_TYPE"), [
		"select", [
			'memcache' => GetMessage('CLUSTER_OPTIONS_CACHE_TYPE_MEMCACHE'),
			'redis' => GetMessage('CLUSTER_OPTIONS_CACHE_TYPE_REDIS'),
		]
	]],
	["heading", GetMessage("CLUSTER_OPTIONS_REDIS_SETTINGS"), ["heading", ""]],
	["redis_pconnect", GetMessage("CLUSTER_REDIS_PCONNECT_SETTING"), ["checkbox", "Y"]],

	["failower_settings", GetMessage("CLUSTER_OPTIONS_REDIS_FAILOWER_SETTINGS"), [
		"select", [
			"0" => GetMessage("REDIS_OPTIONS_FAILOWER_NONE"),
			"1" => GetMessage("REDIS_OPTIONS_FAILOWER_ERROR"),
			"2" => GetMessage("REDIS_OPTIONS_FAILOVER_DISTRIBUTE"),
			"3" => GetMessage("REDIS_OPTIONS_FAILOVER_DISTRIBUTE_SLAVES"),
		]
	]],
	["redis_timeoit", GetMessage("CLUSTER_OPTIONS_MAX_SLAVE_DELAY")." ", ["text", 6]],
	["redis_read_timeout", GetMessage("CLUSTER_OPTIONS_MAX_SLAVE_DELAY")." ", ["text", 6]],
];

$tabs = [[
	"DIV" => "edit1",
	"TAB" => GetMessage("MAIN_TAB_SET"),
	"ICON" => $module_id."_settings",
	"TITLE" => GetMessage("MAIN_TAB_TITLE_SET")
]];

$tabControl = new CAdminTabControl("tabControl", $tabs);

if ($REQUEST_METHOD == "POST" && $Update.$Apply.$RestoreDefaults <> '' && $RIGHT == "W" && check_bitrix_sessid())
{
	if ($RestoreDefaults <> '')
	{
		COption::RemoveOption($module_id);
	}
	else
	{
		foreach ($options as $option)
		{
			$name = $option[0];
			$val = $_REQUEST[$name];
			if ($option[2][0] == "checkbox" && $val != "Y")
			{
				$val = "N";
			}
			COption::SetOptionString($module_id, $name, $val, $option[1]);
		}
	}

	$servers = CClusterRedis::loadConfig();
	CClusterRedis::saveConfig($servers);

	if ($_REQUEST["back_url_settings"] <> '')
	{
		if (($Apply <> '') || ($RestoreDefaults <> ''))
		{
			LocalRedirect($APPLICATION->GetCurPage()."?mid=".urlencode($module_id)."&lang=".urlencode(LANGUAGE_ID)."&back_url_settings=".urlencode($_REQUEST["back_url_settings"])."&".$tabControl->ActiveTabParam());
		}
		else
		{
			LocalRedirect($_REQUEST["back_url_settings"]);
		}
	}
	else
	{
		LocalRedirect($APPLICATION->GetCurPage()."?mid=".urlencode($module_id)."&lang=".urlencode(LANGUAGE_ID)."&".$tabControl->ActiveTabParam());
	}
}

?><form method="post" action="<?echo $APPLICATION->GetCurPage()?>?mid=<?=urlencode($module_id)?>&amp;lang=<?=LANGUAGE_ID?>"><?

$tabControl->Begin();
$tabControl->BeginNextTab();

	foreach ($options as $option):

		$type = $option[2];
		if ($type[0] != "heading"):
			$val = COption::GetOptionString($module_id, $option[0]);
			?><tr><?
				?><td width="40%" nowrap <?if($type[0]=="textarea") echo 'class="adm-detail-valign-top"'?>><?
					?><label for="<?echo htmlspecialcharsbx($option[0])?>"><?echo $option[1]?>:</label><?
				?><td width="60%"><?
		endif;

		if ($type[0] == "checkbox"):
			?><input type="checkbox" name="<?=htmlspecialcharsbx($option[0]);?>" id="<?=htmlspecialcharsbx($option[0]);?>"value="Y"<? if ($val == "Y") echo " checked";?>><?
		elseif ($type[0] == "text"):
			?><input type="text" size="<?=$type[1]?>" maxlength="255" value="<?=htmlspecialcharsbx($val);?>"name="<?=htmlspecialcharsbx($option[0]);?>"id="<?=htmlspecialcharsbx($option[0]);?>"><?
		elseif ($type[0] == "textarea"):
			?><textarea rows="<?=$type[1];?>" cols="<?=$type[2];?>" name="<?=htmlspecialcharsbx($option[0]);?>"id="<?=htmlspecialcharsbx($option[0]);?>"><?=htmlspecialcharsbx($val);?></textarea><?
		elseif ($type[0] == "select"):
			?><select name="<?=htmlspecialcharsbx($option[0]);?>" ><?
				foreach ($type[1] as $key => $value):
					?><option value="<?=htmlspecialcharsbx($key);?>" <? if ($val == $key) echo 'selected="selected"'?>><?=htmlspecialcharsEx($value);?></option><?
				endforeach
			?></select><?
		elseif ($type[0] == "heading"):
			?><tr class="heading"><td colspan="2"><b><?=$option[1];?></b></td></tr><?
		endif;

		if ($type[0] != "heading"):
			?></td></tr><?
		endif;

	endforeach;

$tabControl->Buttons();

	?><input <?if ($RIGHT<"W") echo "disabled" ?> type="submit" name="Update" value="<?=GetMessage("MAIN_SAVE")?>" title="<?=GetMessage("MAIN_OPT_SAVE_TITLE")?>" class="adm-btn-save"><?
	?><input <?if ($RIGHT<"W") echo "disabled" ?> type="submit" name="Apply" value="<?=GetMessage("MAIN_OPT_APPLY")?>" title="<?=GetMessage("MAIN_OPT_APPLY_TITLE")?>"><?

	if ($_REQUEST["back_url_settings"] <> ''):
		?><input <?if ($RIGHT<"W") echo "disabled" ?> type="button" name="Cancel" value="<?=GetMessage("MAIN_OPT_CANCEL")?>" title="<?=GetMessage("MAIN_OPT_CANCEL_TITLE")?>" onclick="window.location='<?echo htmlspecialcharsbx(CUtil::addslashes($_REQUEST["back_url_settings"]))?>'"><?
		?><input type="hidden" name="back_url_settings" value="<?=htmlspecialcharsbx($_REQUEST["back_url_settings"])?>"><?
	endif;

	?><input type="submit" name="RestoreDefaults" title="<?echo GetMessage("MAIN_HINT_RESTORE_DEFAULTS")?>" OnClick="confirm('<?echo AddSlashes(GetMessage("MAIN_HINT_RESTORE_DEFAULTS_WARNING"))?>')" value="<?echo GetMessage("MAIN_RESTORE_DEFAULTS")?>">
	<?=bitrix_sessid_post();
	$tabControl->End();
?></form><?
endif;

?>