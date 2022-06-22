<?php
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/cluster/prolog.php");
IncludeModuleLangFile(__FILE__);

if (!$USER->IsAdmin())
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

$cacheType = COption::GetOptionString('cluster', 'cache_type', 'memcache');
if (!extension_loaded('redis') || $cacheType != 'redis')
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
	die();
}

$group_id = intval($_GET["group_id"]);
if (!CClusterGroup::GetArrayByID($group_id))
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

$errorMessage = null;
$sTableID = "tbl_cluster_redis_list";
$oSort = new CAdminSorting($sTableID, "ID", "ASC");
$lAdmin = new CAdminList($sTableID, $oSort);

if ($arID = $lAdmin->GroupAction())
{
	foreach ($arID as $ID)
	{
		if ($ID == '')
		{
			continue;
		}

		$ID = intval($ID);
		switch ($_REQUEST['action'])
		{
			case "delete":
				CClusterRedis::delete($ID);
				break;
			case "pause":
				CClusterRedis::pause($ID);
				if(CClusterRedis::$systemConfigurationUpdate === false)
					$errorMessage = new CAdminMessage(GetMessage("CLU_REDIS_LIST_WARNING_NO_CACHE"));
				break;
			case "resume":
				CClusterRedis::resume($ID);
				break;
		}
	}
}

$arHeaders = [[
		"id" => "ID",
		"content" => GetMessage("CLU_REDIS_LIST_ID"),
		"align" => "right",
		"default" => true,
	], [
		"id" => "FLAG",
		"content" => GetMessage("CLU_REDIS_LIST_FLAG"),
		"align" => "center",
		"default" => true,
	], [
		"id" => "STATUS",
		"content" => GetMessage("CLU_REDIS_LIST_STATUS"),
		"align" => "center",
		"default" => true,
	], [
		"id" => "HOST",
		"content" => GetMessage("CLU_REDIS_LIST_HOST"),
		"align" => "left",
		"default" => true,
	],
];

$lAdmin->AddHeaders($arHeaders);

if (!isset($_SESSION["REDIS_LIST"]))
{
	$_SESSION["REDIS_LIST"] = [];
}

$cData = new CClusterRedis;
$rsData = $cData->getList();

$uptime = false;
$rsData = new CAdminResult($rsData, $sTableID);
while ($arRes = $rsData->Fetch()):

	if (!$arRes["GROUP_ID"])
	{
		$arRes = CClusterRedis::getByID($arRes["ID"]);
		$cData->Update($arRes["ID"], $arRes);
		$arRes = CClusterRedis::getByID($arRes["ID"]);
	}

	if ($arRes["GROUP_ID"] != $group_id)
	{
		continue;
	}

	$row =& $lAdmin->AddRow($arRes["ID"], $arRes);

	$row->AddViewField("ID", '<a href="cluster_redis_edit.php?lang='.LANGUAGE_ID.'&group_id='.$group_id.'&ID='.$arRes["ID"].'">'.$arRes["ID"].'</a>');

	$html = '';
	if (true)
	{
		$html .= '<table width="100%">';
		$arSlaveStatus = CClusterRedis::getStatus($arRes["ID"]);
		foreach ($arSlaveStatus as $key => $value)
		{
			if ($key == 'uptime_in_seconds')
			{
				$uptime = $value;
			}
			elseif ($key == 'keyspace_misses')
			{
				$get_misses = $value;
			}

			if ($key == 'uptime')
			{
			}
			elseif ($key == 'limit_maxbytes')
				$html .= '
				<tr>
					<td width="50%" align=right>'.$key.':</td>
					<td align=left>'.CFile::FormatSize($value).'</td>
				</tr>';

			elseif ($key == 'using_bytes')
				$html .= '
				<tr>
					<td width="50%" align=right>'.$key.':</td>
					<td align=left>'.CFile::FormatSize($value).(
					$limit_maxbytes > 0?
						' ('.round($value/$limit_maxbytes*100,2).'%)':
						''
					).'</td>
				</tr>';
			elseif ($key == 'listen_disabled_num')
				$html .= '
				<tr>
					<td width="50%" align=right>'.$key.':</td>
					<td align=left>'.(
					$value > 0?
						"<span style=\"color:red\">".$value."</span>":
						"<span style=\"color:green\">".$value."</span>"
					).'</td>
				</tr>';
			elseif ($key == 'get_hits')
				$html .= '
				<tr>
					<td width="50%" align=right>'.$key.':</td>
					<td align=left>'.$value.' '.(
					$value > 0?
						'('.(round($value/($value+$get_misses)*100,2)).'%)':
						''
					).'</td>
				</tr>';
			elseif ($key == 'cmd_get')
				$html .= '
				<tr>
					<td width="50%" align=right>'.$key.':</td>
					<td align=left>'.$value.(
					isset($_SESSION["REDIS_LIST"][$arRes["ID"]]) && $value > $_SESSION["REDIS_LIST"][$arRes["ID"]]?
						" (<span style=\"color:green\">+".($value - $_SESSION["REDIS_LIST"][$arRes["ID"]])."</span>)":
						""
					).'</td>
				</tr>';
			else
				$html .= '
				<tr>
					<td width="50%" align=right>'.$key.':</td>
					<td align=left>'.$value.'</td>
				</tr>';

			if ($key == 'cmd_get')
			{
				$_SESSION["REDIS_LIST"][$arRes["ID"]] = $value;
			}
		}
		$html .= '</table>';
	}

	$html = $arRes["STATUS"]."<br />".$html;
	$row->AddViewField("STATUS", $html);

	if ($arRes["STATUS"] == "ONLINE" && $uptime > 0)
	{
		$htmlFLAG = '<div class="lamp-green"></div>';
	}
	else
	{
		$htmlFLAG = '<div class="lamp-red"></div>';
	}
	if ($uptime === false)
	{
		$htmlFLAG .= GetMessage("CLU_REDIS_NOCONNECTION");
	}
	else
	{
		$htmlFLAG .= GetMessage("CLU_REDIS_UPTIME") . "<br>" . FormatDate([
			"s" => "sdiff",
			"i" => "idiff",
			"H" => "Hdiff",
			"" => "ddiff",
		], time() - $uptime);
	}

	$row->AddViewField("FLAG", $htmlFLAG);
	$row->AddViewField("HOST", $arRes["HOST"].":".$arRes["PORT"]);

	$arActions = [];
	$arActions[] = [
		"ICON" => "edit",
		"DEFAULT" => true,
		"TEXT" => GetMessage("CLU_REDIS_LIST_EDIT"),
		"ACTION" => $lAdmin->ActionRedirect('cluster_redis_edit.php?lang='.LANGUAGE_ID.'&group_id='.$group_id.'&ID='.$arRes["ID"])
	];

	if ($arRes["STATUS"] == "READY")
	{
		$arActions[] = [
			"ICON" => "delete",
			"TEXT" => GetMessage("CLU_REDIS_LIST_DELETE"),
			"ACTION" => "if(confirm('".GetMessage("CLU_REDIS_LIST_DELETE_CONF")."')) ".$lAdmin->ActionDoGroup($arRes["ID"], "delete", 'group_id='.$group_id)
		];
		$arActions[] = [
			"TEXT" => GetMessage("CLU_REDIS_LIST_START_USING"),
			"ACTION" => $lAdmin->ActionDoGroup($arRes["ID"], "resume", 'group_id='.$group_id),
		];
	}
	elseif ($arRes["STATUS"] == "ONLINE")
	{
		$arActions[] = [
			"TEXT" => GetMessage("CLU_REDIS_LIST_STOP_USING"),
			"ACTION" => $lAdmin->ActionDoGroup($arRes["ID"], "pause", 'group_id='.$group_id),
		];
	}

	if (!empty($arActions))
	{
		$row->AddActions($arActions);
	}

endwhile;

$lAdmin->AddFooter([[
			"title" => GetMessage("MAIN_ADMIN_LIST_SELECTED"),
			"value" => $rsData->SelectedRowsCount(),
		], [
			"counter" => true,
			"title" => GetMessage("MAIN_ADMIN_LIST_CHECKED"),
			"value" => "0",
		],
	]
);

$aContext = [[
		"TEXT" => GetMessage("CLU_REDIS_LIST_ADD"),
		"LINK" => "/bitrix/admin/cluster_redis_edit.php?lang=".LANGUAGE_ID.'&group_id='.$group_id,
		"TITLE" => GetMessage("CLU_REDIS_LIST_ADD_TITLE"),
		"ICON" => "btn_new",
	], [
		"TEXT" => GetMessage("CLU_REDIS_LIST_REFRESH"),
		"LINK" => "cluster_redis_list.php?lang=".LANGUAGE_ID.'&group_id='.$group_id,
	],
];

$lAdmin->AddAdminContextMenu($aContext,false);
if ($errorMessage)
{
	echo $errorMessage->Show();
}

$lAdmin->CheckListMode();
$APPLICATION->SetTitle(GetMessage("CLU_REDIS_LIST_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

if ($message)
{
	echo $message->Show();
}
$lAdmin->DisplayList();

echo BeginNote(), GetMessage("CLU_REDIS_LIST_NOTE"), EndNote();
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>