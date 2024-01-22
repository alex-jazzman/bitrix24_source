<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';
/** @global CUser $USER */
global $USER;
/** @global CMain $APPLICATION */
global $APPLICATION;
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/cluster/prolog.php';
IncludeModuleLangFile(__FILE__);

if (!$USER->isAdmin())
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$cacheType = COption::GetOptionString('cluster', 'cache_type', 'memcache');
if (!extension_loaded('memcache') || $cacheType != 'memcache')
{
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';
	if ($cacheType != 'memcache')
	{
		ShowError(GetMessage('CLU_MEMCACHE_DISABLED'));
	}
	else
	{
		ShowError(GetMessage('CLU_MEMCACHE_NO_EXTENTION'));
	}
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
	die();
}

$group_id = intval($_GET['group_id']);
if (!CClusterGroup::GetArrayByID($group_id))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$errorMessage = null;
$sTableID = 'tbl_cluster_memcache_list';
$oSort = new CAdminSorting($sTableID, 'ID', 'ASC');
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
		case 'delete':
			CClusterMemcache::Delete($ID);
			break;
		case 'pause':
			CClusterMemcache::Pause($ID);
			if (CClusterMemcache::$systemConfigurationUpdate === false)
			{
				$errorMessage = new CAdminMessage(GetMessage('CLU_MEMCACHE_LIST_WARNING_NO_CACHE'));
			}
			break;
		case 'resume':
			CClusterMemcache::Resume($ID);
			break;
		}
	}
}

$arHeaders = [
	[
		'id' => 'ID',
		'content' => GetMessage('CLU_MEMCACHE_LIST_ID'),
		'align' => 'right',
		'default' => true,
	],
	[
		'id' => 'FLAG',
		'content' => GetMessage('CLU_MEMCACHE_LIST_FLAG'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'STATUS',
		'content' => GetMessage('CLU_MEMCACHE_LIST_STATUS'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'WEIGHT',
		'content' => GetMessage('CLU_MEMCACHE_LIST_WEIGHT'),
		'align' => 'right',
		'default' => true,
	],
	[
		'id' => 'HOST',
		'content' => GetMessage('CLU_MEMCACHE_LIST_HOST'),
		'align' => 'left',
		'default' => true,
	],
];

$lAdmin->AddHeaders($arHeaders);

if (!isset($_SESSION['MEMCACHE_LIST']))
{
	$_SESSION['MEMCACHE_LIST'] = [];
}

$rsData = CClusterMemcache::GetList();

$uptime = false;
$rsData = new CAdminResult($rsData, $sTableID);
while ($arRes = $rsData->Fetch())
{
	if (!$arRes['GROUP_ID'])
	{
		$arRes = CClusterMemcache::GetByID($arRes['ID']);
		$cData = new CClusterMemcache;
		$cData->Update($arRes['ID'], $arRes);
		$arRes = CClusterMemcache::GetByID($arRes['ID']);
	}

	if ($arRes['GROUP_ID'] != $group_id)
	{
		continue;
	}

	$row =& $lAdmin->AddRow($arRes['ID'], $arRes);

	$row->AddViewField('ID', '<a href="cluster_memcache_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&ID=' . $arRes['ID'] . '">' . $arRes['ID'] . '</a>');

	$arSlaveStatus = CClusterMemcache::GetStatus($arRes['ID']);
	$uptime = 0;
	$get_misses = 0;
	$limit_maxbytes = 0;
	foreach ($arSlaveStatus as $key => $value)
	{
		if ($key == 'uptime')
		{
			$uptime = $value;
		}
		elseif ($key == 'get_misses')
		{
			$get_misses = $value;
		}
		elseif ($key == 'limit_maxbytes')
		{
			$limit_maxbytes = $value;
		}
	}

	$html = '<table width="100%">';
	foreach ($arSlaveStatus as $key => $value)
	{
		if ($key == 'bytes')
		{
			$key = 'using_bytes';
		}

		if ($key == 'uptime')
		{
		}
		elseif ($key == 'limit_maxbytes')
		{
			$html .= '
			<tr>
				<td width="50%" align=right>' . $key . ':</td>
				<td align=left>' . CFile::FormatSize($value) . '</td>
			</tr>
			';
		}
		elseif ($key == 'using_bytes')
		{
			$html .= '
			<tr>
				<td width="50%" align=right>' . $key . ':</td>
				<td align=left>' . CFile::FormatSize($value) . (
					$limit_maxbytes > 0 ?
					' (' . round($value / $limit_maxbytes * 100,2) . '%)' :
					''
				) . '</td>
			</tr>
			';
		}
		elseif ($key == 'listen_disabled_num')
		{
			$html .= '
			<tr>
				<td width="50%" align=right>' . $key . ':</td>
				<td align=left>' . (
					$value > 0 ?
					'<span style="color:red">' . $value . '</span>' :
					'<span style="color:green">' . $value . '</span>'
				) . '</td>
			</tr>
			';
		}
		elseif ($key == 'get_hits')
		{
			$html .= '
			<tr>
				<td width="50%" align=right>' . $key . ':</td>
				<td align=left>' . $value . ' ' . (
					$value > 0 ?
					'(' . (round($value / ($value + $get_misses) * 100,2)) . '%)' :
					''
				) . '</td>
			</tr>
			';
		}
		elseif ($key == 'cmd_get')
		{
			$html .= '
			<tr>
				<td width="50%" align=right>' . $key . ':</td>
				<td align=left>' . $value . (
					isset($_SESSION['MEMCACHE_LIST'][$arRes['ID']]) && $value > $_SESSION['MEMCACHE_LIST'][$arRes['ID']] ?
					' (<span style="color:green">+' . ($value - $_SESSION['MEMCACHE_LIST'][$arRes['ID']]) . '</span>)' :
					''
				) . '</td>
			</tr>
			';
		}
		else
		{
			$html .= '
			<tr>
				<td width="50%" align=right>' . $key . ':</td>
				<td align=left>' . $value . '</td>
			</tr>
			';
		}

		if ($key == 'cmd_get')
		{
			$_SESSION['MEMCACHE_LIST'][$arRes['ID']] = $value;
		}
	}
	$html .= '</table>';

	$html = $arRes['STATUS'] . '<br />' . $html;
	$row->AddViewField('STATUS', $html);

	if ($arRes['STATUS'] == 'ONLINE' && $uptime > 0)
	{
		$htmlFLAG = '<div class="lamp-green"></div>';
	}
	else
	{
		$htmlFLAG = '<div class="lamp-red"></div>';
	}

	if ($uptime === false)
	{
		$htmlFLAG .= GetMessage('CLU_MEMCACHE_NOCONNECTION');
	}
	else
	{
		$htmlFLAG .= GetMessage('CLU_MEMCACHE_UPTIME') . '<br>' . FormatDate([
			's' => 'sdiff',
			'i' => 'idiff',
			'H' => 'Hdiff',
			'' => 'ddiff',
		], time() - $uptime);
	}

	$row->AddViewField('FLAG', $htmlFLAG);

	$row->AddViewField('HOST', $arRes['HOST'] . ':' . $arRes['PORT']);

	$arActions = [];
	$arActions[] = [
		'ICON' => 'edit',
		'DEFAULT' => true,
		'TEXT' => GetMessage('CLU_MEMCACHE_LIST_EDIT'),
		'ACTION' => $lAdmin->ActionRedirect('cluster_memcache_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&ID=' . $arRes['ID'])
	];

	if ($arRes['STATUS'] == 'READY')
	{
		$arActions[] = [
			'ICON' => 'delete',
			'TEXT' => GetMessage('CLU_MEMCACHE_LIST_DELETE'),
			'ACTION' => "if(confirm('" . GetMessage('CLU_MEMCACHE_LIST_DELETE_CONF') . "')) " . $lAdmin->ActionDoGroup($arRes['ID'], 'delete', 'group_id=' . $group_id)
		];
		$arActions[] = [
			'TEXT' => GetMessage('CLU_MEMCACHE_LIST_START_USING'),
			'ACTION' => $lAdmin->ActionDoGroup($arRes['ID'], 'resume', 'group_id=' . $group_id),
		];
	}
	elseif ($arRes['STATUS'] == 'ONLINE')
	{
		$arActions[] = [
			'TEXT' => GetMessage('CLU_MEMCACHE_LIST_STOP_USING'),
			'ACTION' => $lAdmin->ActionDoGroup($arRes['ID'], 'pause', 'group_id=' . $group_id),
		];
	}

	if (!empty($arActions))
	{
		$row->AddActions($arActions);
	}
}

$lAdmin->AddFooter(
	[
		[
			'title' => GetMessage('MAIN_ADMIN_LIST_SELECTED'),
			'value' => $rsData->SelectedRowsCount(),
		],
		[
			'counter' => true,
			'title' => GetMessage('MAIN_ADMIN_LIST_CHECKED'),
			'value' => '0',
		],
	]
);

$aContext = [
	[
		'TEXT' => GetMessage('CLU_MEMCACHE_LIST_ADD'),
		'LINK' => '/bitrix/admin/cluster_memcache_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
		'TITLE' => GetMessage('CLU_MEMCACHE_LIST_ADD_TITLE'),
		'ICON' => 'btn_new',
	],
	[
		'TEXT' => GetMessage('CLU_MEMCACHE_LIST_REFRESH'),
		'LINK' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
	],
];

$lAdmin->AddAdminContextMenu($aContext, /*$bShowExcel=*/false);

if ($errorMessage)
{
	echo $errorMessage->Show();
}

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage('CLU_MEMCACHE_LIST_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$lAdmin->DisplayList();

echo BeginNote(), GetMessage('CLU_MEMCACHE_LIST_NOTE'), EndNote();

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
