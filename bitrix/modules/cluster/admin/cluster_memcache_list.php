<?php

use Bitrix\Main\Localization\Loc;

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 */

global $USER;
global $APPLICATION;

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/cluster/prolog.php';
IncludeModuleLangFile(__FILE__);

if (!$USER->isAdmin())
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));
}

$cacheType = Bitrix\Main\Config\Option::get('cluster', 'cache_type', 'memcache');

if ($cacheType != 'memcache' && $cacheType != 'memcached')
{
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';
	ShowError(Loc::getMessage('CLU_MEMCACHE_DISABLED'));
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
	die();
}

if (
	($cacheType == 'memcache' && !extension_loaded('memcache'))
	|| ($cacheType == 'memcached' && !extension_loaded('memcached'))
)
{
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';
	if ($cacheType == 'memcache')
	{
		ShowError(Loc::getMessage('CLU_MEMCACHE_NO_EXTENTION'));
	}
	elseif ($cacheType == 'memcached')
	{
		ShowError(Loc::getMessage('CLU_MEMCACHED_NO_EXTENTION'));
	}

	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
	die();
}

if ($cacheType == 'memcache')
{
	$cache = CClusterMemcache::class;
}
else
{
	$cache = Bitrix\Cluster\MemcachedClusterHelper::class;
}

$group_id = intval($_GET['group_id']);
if (!CClusterGroup::GetArrayByID($group_id))
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));
}

$errorMessage = null;
$tableID = 'tbl_cluster_memcache_list';
$sort = new CAdminSorting($tableID, 'ID', 'ASC');
$adminList = new CAdminList($tableID, $sort);

if ($ids = $adminList->GroupAction())
{
	foreach ($ids as $id)
	{
		$id = (int) $id;
		if ($id <= 0)
		{
			continue;
		}

		switch ($_REQUEST['action'])
		{
			case 'delete':
				$cache::delete($id);
				break;
			case 'pause':
				$cache::pause($id);
				if ($cache::$systemConfigurationUpdate === false)
				{
					$errorMessage = new CAdminMessage(Loc::getMessage('CLU_MEMCACHE_LIST_WARNING_NO_CACHE'));
				}
				break;
			case 'resume':
				$cache::resume($id);
				break;
		}
	}
}

$headers = [
	[
		'id' => 'ID',
		'content' => Loc::getMessage('CLU_MEMCACHE_LIST_ID'),
		'align' => 'right',
		'default' => true,
	],
	[
		'id' => 'FLAG',
		'content' => Loc::getMessage('CLU_MEMCACHE_LIST_FLAG'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'STATUS',
		'content' => Loc::getMessage('CLU_MEMCACHE_LIST_STATUS'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'WEIGHT',
		'content' => Loc::getMessage('CLU_MEMCACHE_LIST_WEIGHT'),
		'align' => 'right',
		'default' => true,
	],
	[
		'id' => 'HOST',
		'content' => Loc::getMessage('CLU_MEMCACHE_LIST_HOST'),
		'align' => 'left',
		'default' => true,
	],
];

$adminList->AddHeaders($headers);

if (!isset($_SESSION['MEMCACHE_LIST']))
{
	$_SESSION['MEMCACHE_LIST'] = [];
}

$uptime = false;
$servers = $cache::GetList();
$servers = new CAdminResult($servers, $tableID);
while ($server = $servers->Fetch())
{
	if (!$server['GROUP_ID'])
	{
		$server = $cache::GetByID($server['ID']);
		$cData = new $cache;
		$cData->Update($server['ID'], $server);
		$server = $cache::GetByID($server['ID']);
	}

	if ($server['GROUP_ID'] != $group_id)
	{
		continue;
	}

	$row = $adminList->AddRow($server['ID'], $server);

	$row->AddViewField('ID', '<a href="cluster_memcache_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&ID=' . $server['ID'] . '">' . $server['ID'] . '</a>');
	$slaveStatus = $cache::getServerStatus($server['ID']);
	$uptime = 0;
	$get_misses = 0;
	$limit_maxbytes = 0;
	foreach ($slaveStatus as $key => $value)
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
	foreach ($slaveStatus as $key => $value)
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
					isset($_SESSION['MEMCACHE_LIST'][$server['ID']]) && $value > $_SESSION['MEMCACHE_LIST'][$server['ID']] ?
					' (<span style="color:green">+' . ($value - $_SESSION['MEMCACHE_LIST'][$server['ID']]) . '</span>)' :
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
			$_SESSION['MEMCACHE_LIST'][$server['ID']] = $value;
		}
	}
	$html .= '</table>';

	$html = $server['STATUS'] . '<br />' . $html;
	$row->AddViewField('STATUS', $html);

	if ($server['STATUS'] == 'ONLINE' && $uptime > 0)
	{
		$htmlFLAG = '<div class="lamp-green"></div>';
	}
	else
	{
		$htmlFLAG = '<div class="lamp-red"></div>';
	}

	if ($uptime === false)
	{
		$htmlFLAG .= Loc::getMessage('CLU_MEMCACHE_NOCONNECTION');
	}
	else
	{
		$htmlFLAG .= Loc::getMessage('CLU_MEMCACHE_UPTIME') . '<br>' . FormatDate([
			's' => 'sdiff',
			'i' => 'idiff',
			'H' => 'Hdiff',
			'' => 'ddiff',
		], time() - $uptime);
	}

	$row->AddViewField('FLAG', $htmlFLAG);
	$row->AddViewField('HOST', $server['HOST'] . ':' . $server['PORT']);

	$arActions = [];
	$arActions[] = [
		'ICON' => 'edit',
		'DEFAULT' => true,
		'TEXT' => Loc::getMessage('CLU_MEMCACHE_LIST_EDIT'),
		'ACTION' => $adminList->ActionRedirect('cluster_memcache_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&ID=' . $server['ID'])
	];

	if ($server['STATUS'] == 'READY')
	{
		$arActions[] = [
			'ICON' => 'delete',
			'TEXT' => Loc::getMessage('CLU_MEMCACHE_LIST_DELETE'),
			'ACTION' => "if(confirm('" . Loc::getMessage('CLU_MEMCACHE_LIST_DELETE_CONF') . "')) " . $adminList->ActionDoGroup($server['ID'], 'delete', 'group_id=' . $group_id)
		];
		$arActions[] = [
			'TEXT' => Loc::getMessage('CLU_MEMCACHE_LIST_START_USING'),
			'ACTION' => $adminList->ActionDoGroup($server['ID'], 'resume', 'group_id=' . $group_id),
		];
	}
	elseif ($server['STATUS'] == 'ONLINE')
	{
		$arActions[] = [
			'TEXT' => Loc::getMessage('CLU_MEMCACHE_LIST_STOP_USING'),
			'ACTION' => $adminList->ActionDoGroup($server['ID'], 'pause', 'group_id=' . $group_id),
		];
	}

	if (!empty($arActions))
	{
		$row->AddActions($arActions);
	}
}

$adminList->AddFooter(
	[
		[
			'title' => Loc::getMessage('MAIN_ADMIN_LIST_SELECTED'),
			'value' => $servers->SelectedRowsCount(),
		],
		[
			'counter' => true,
			'title' => Loc::getMessage('MAIN_ADMIN_LIST_CHECKED'),
			'value' => '0',
		],
	]
);

$aContext = [
	[
		'TEXT' => Loc::getMessage('CLU_MEMCACHE_LIST_ADD'),
		'LINK' => '/bitrix/admin/cluster_memcache_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
		'TITLE' => Loc::getMessage('CLU_MEMCACHE_LIST_ADD_TITLE'),
		'ICON' => 'btn_new',
	],
	[
		'TEXT' => Loc::getMessage('CLU_MEMCACHE_LIST_REFRESH'),
		'LINK' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
	],
];

$adminList->AddAdminContextMenu($aContext, /*$bShowExcel=*/false);

if ($errorMessage)
{
	echo $errorMessage->Show();
}

$adminList->CheckListMode();

$APPLICATION->SetTitle(Loc::getMessage('CLU_MEMCACHE_LIST_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$adminList->DisplayList();

echo BeginNote(), Loc::getMessage('CLU_MEMCACHE_LIST_NOTE'), EndNote();

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
