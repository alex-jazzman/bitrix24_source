<?php
/** @global CMain $APPLICATION */
/** @global CUser $USER */

use Bitrix\Main\Page\Asset;
use Bitrix\Main\Localization\Loc;

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/cluster/prolog.php');
IncludeModuleLangFile(__FILE__);

$asset = Asset::getInstance();
$asset->addString('<link rel="stylesheet" type="text/css" href="' . $asset->getFullAssetPath('/bitrix/css/cluster/cluster_list.css') . '">');

if (!$USER->IsAdmin())
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));
}

$cacheType = Bitrix\Main\Config\Option::get('cluster', 'cache_type', 'memcache');
if (!extension_loaded('redis') || $cacheType != 'redis')
{
	require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');
	if ($cacheType != 'redis')
	{
		ShowError(Loc::getMessage('CLU_REDIS_DISABLED'));
	}
	else
	{
		ShowError(Loc::getMessage('CLU_REDIS_NO_EXTENTION'));
	}

	require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php');
	die();
}

$group_id = intval($_GET['group_id']);
if (!CClusterGroup::GetArrayByID($group_id))
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));
}

function getHtml($server)
{
	$html = '<table width="100%">';
	$status = CClusterRedis::getStatus($server);

	foreach ($status as $key => $val)
	{
		switch ($key)
		{
			case 'maxbytes':
			case 'total_system_memory':
				$html .= '<tr><td width="50%" align=right>' . $key . ':</td><td align=left>' . CFile::FormatSize($val) . '</td></tr>';
				break;
			case 'used_memory':
				$html .= '<tr><td width="50%" align=right>' . $key . ':</td><td align=left>' . CFile::FormatSize($val)
					. ($status['maxbytes'] > 0 ? ' (' . round($val / $status['maxbytes'] * 100, 2) . '%)' : '')
					. '</td></tr>';
				break;
			default:
				$html .= '<tr><td width="50%" align=right>' . $key . ':</td><td align=left>' . $val . '</td></tr>';
				break;
		}
	}
	$html .= '</table>';

	return ['html' => $html, 'status' => $status];
}

$errorMessage = null;
$tableID = 'tbl_cluster_redis_list';
// $sort = new CAdminSorting($tableID, 'ID', 'ASC');
$lAdmin = new CAdminList($tableID);

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
				CClusterRedis::delete($ID);
				break;

			case 'pause':
				CClusterRedis::pause($ID);
				if (CClusterRedis::$systemConfigurationUpdate === false)
				{
					$errorMessage = new CAdminMessage(Loc::getMessage('CLU_REDIS_LIST_WARNING_NO_CACHE'));
				}
				break;

			case 'resume':
				CClusterRedis::resume($ID);
				break;

			case 'resumecluster':

				$masterCnt = 0;
				$redisList = [];

				$cluster = new CClusterRedis;
				$rsList = $cluster->getList();
				while ($item = $rsList->Fetch())
				{
					if (
						$item['GROUP_ID'] == $group_id
						&& $item['MODE'] == 'CLUSTER'
						&& $item['STATUS'] == 'READY'
					)
					{
						if ($item['ROLE'] == 'MASTER')
						{
							$masterCnt++;
						}
						$redisList[] = $item['ID'];
					}
				}

				if ($masterCnt > 2)
				{
					CClusterRedis::resume($redisList);
				}
				break;

			case 'pausecluster':
				$redisList = [];

				$cluster = new CClusterRedis;
				$rsList = $cluster->getList();
				while ($item = $rsList->Fetch())
				{
					if (
						$item['GROUP_ID'] == $group_id
						&& $item['MODE'] == 'CLUSTER'
						&& $item['STATUS'] == 'ONLINE'
					)
					{
						$redisList[] = $item['ID'];
					}
				}

				if (count($redisList) > 0)
				{
					CClusterRedis::pause($redisList);
				}

				break;
		}
	}
}

$arHeaders = [[
		'id' => 'ID',
		'content' => Loc::getMessage('CLU_REDIS_LIST_ID'),
		'align' => 'right',
		'default' => true,
	], [
		'id' => 'FLAG',
		'content' => Loc::getMessage('CLU_REDIS_LIST_FLAG'),
		'align' => 'center',
		'default' => true,
	], [
		'id' => 'STATUS',
		'content' => Loc::getMessage('CLU_REDIS_LIST_STATUS'),
		'align' => 'center',
		'default' => true,
	], [
		'id' => 'HOST',
		'content' => Loc::getMessage('CLU_REDIS_LIST_HOST'),
		'align' => 'left',
		'default' => true,
	],
];

$lAdmin->AddHeaders($arHeaders);

if (!isset($_SESSION['REDIS_LIST']))
{
	$_SESSION['REDIS_LIST'] = [];
}

function serverSort($a, $b)
{
	if ($a['MODE'] == $b['MODE'])
	{
		return 0;
	}
	return $a['MODE'] > $b['MODE'] ? -1 : 1;
}

$cData = new CClusterRedis;
$data = $cData->getList();

$uptime = false;
$data = new CAdminResult($data, $tableID);

$servers = [];
$cluster = [
	'ONLINE' => 0,
	'MASTER' => 0,
	'READY' => 0
];

while ($server = $data->Fetch())
{
	$servers[] = $server;

	if ($server['STATUS'] == 'ONLINE')
	{
		$cluster['ONLINE']++;
	}

	if ($server['MODE'] == 'CLUSTER')
	{
		if ($server['STATUS'] != 'ONLINE')
		{
			$cluster['READY']++;
		}
	}
}

uasort($servers,  'serverSort');
$first = true;

foreach ($servers as $server)
{
	$actions = [];

	if (!$server['GROUP_ID'])
	{
		$server = CClusterRedis::getByID($server['ID']);
		$cData->Update($server['ID'], $server);
		$server = CClusterRedis::getByID($server['ID']);
	}

	if ($server['GROUP_ID'] != $group_id)
	{
		continue;
	}

	if ($server['MODE'] == 'CLUSTER' && $first)
	{
		$first = false;
		$row = &$lAdmin->AddRow('separator', ['STATUS' => Loc::getMessage('CLU_REDIS_CLUSTER_TITLE')]);

		if ($server['STATUS'] == 'READY' && $cluster['ONLINE'] < 1)
		{
			$actions[] = [
				'TEXT' => Loc::getMessage('CLU_REDIS_LIST_START_USING'),
				'ACTION' => $lAdmin->ActionDoGroup($server['ID'], 'resumecluster', 'group_id=' . $group_id),
			];
		}
		elseif ($server['STATUS'] == 'ONLINE')
		{
			$actions[] = [
				'TEXT' => Loc::getMessage('CLU_REDIS_LIST_STOP_USING'),
				'ACTION' => $lAdmin->ActionDoGroup($server['ID'], 'pausecluster', 'group_id=' . $group_id),
			];
		}

		if (!empty($actions))
		{
			$row->AddActions($actions);
			$actions = [];
		}
	}

	$row =& $lAdmin->AddRow($server['ID'], $server);

	$row->AddViewField("ID", '<a href="cluster_redis_edit.php?lang=' . LANGUAGE_ID
		. '&group_id=' . $group_id . '&ID=' . $server['ID'] . '">' . $server['ID'].'</a>');


	$res = getHtml($server);

	$html = $res['html'];
	$status = $res['status'];
	$uptime = $status['uptime_in_seconds'];
	$html = $server['STATUS'] . '<br />' . $html;
	$row->AddViewField('STATUS', $html);

	if ($server['STATUS'] == 'ONLINE' && $uptime > 0)
	{
		$htmlFlag = '<div class="lamp-green"></div>';
	}
	else
	{
		$htmlFlag = '<div class="lamp-red"></div>';
	}

	if ($uptime === false)
	{
		$htmlFlag .= Loc::getMessage('CLU_REDIS_NOCONNECTION');
	}
	else
	{
		$htmlFlag .= Loc::getMessage('CLU_REDIS_UPTIME') . '<br>' . FormatDate(['s' => 'sdiff', 'i' => 'idiff', 'H' => 'Hdiff', '' => 'ddiff',], time() - $uptime);
	}

	$row->AddViewField('FLAG', $htmlFlag);
	$row->AddViewField('HOST', $server['HOST'] . ':' . $server['PORT']);

	if ($server['MODE'] != 'CLUSTER' || $server['STATUS'] != 'ONLINE')
	{
		$actions[] = [
			'ICON' => 'edit',
			'DEFAULT' => true,
			'TEXT' => Loc::getMessage('CLU_REDIS_LIST_EDIT'),
			'ACTION' => $lAdmin->ActionRedirect('cluster_redis_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&ID=' . $server["ID"])
		];
	}

	if ($server['STATUS'] == 'READY')
	{
		$actions[] = [
			'ICON' => 'delete',
			'TEXT' => Loc::getMessage('CLU_REDIS_LIST_DELETE'),
			'ACTION' => "if(confirm('" . Loc::getMessage("CLU_REDIS_LIST_DELETE_CONF") . "')) " . $lAdmin->ActionDoGroup($server['ID'], 'delete', 'group_id=' . $group_id)
		];

		if ($server['MODE'] != 'CLUSTER' && $cluster['ONLINE'] < 1)
		{
			$actions[] = [
				'TEXT' => Loc::getMessage('CLU_REDIS_LIST_START_USING'),
				'ACTION' => $lAdmin->ActionDoGroup($server['ID'], 'resume', 'group_id=' . $group_id),
			];
		}
	}
	elseif ($server['STATUS'] == 'ONLINE' && $server['MODE'] != 'CLUSTER')
	{
		$actions[] = [
			'TEXT' => Loc::getMessage('CLU_REDIS_LIST_STOP_USING'),
			'ACTION' => $lAdmin->ActionDoGroup($server['ID'], 'pause', 'group_id=' . $group_id),
		];
	}

	if (!empty($actions))
	{
		$row->AddActions($actions);
	}
}

$lAdmin->AddFooter([
	[
		'title' => Loc::getMessage('MAIN_ADMIN_LIST_SELECTED'),
		'value' => $data->SelectedRowsCount(),
	],
	[
		'counter' => true,
		'title' => Loc::getMessage('MAIN_ADMIN_LIST_CHECKED'),
		'value' => '0',
	],
]);

$aContext = [
	[
		'TEXT' => Loc::getMessage('CLU_REDIS_LIST_ADD'),
		'LINK' => '/bitrix/admin/cluster_redis_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
		'TITLE' => Loc::getMessage('CLU_REDIS_LIST_ADD_TITLE'),
		'ICON' => 'btn_new',
	],
	[
		'TEXT' => Loc::getMessage('CLU_REDIS_LIST_REFRESH'),
		'LINK' => 'cluster_redis_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
	],
];

$lAdmin->AddAdminContextMenu($aContext,false);
if ($errorMessage)
{
	echo $errorMessage->Show();
}

$lAdmin->CheckListMode();
$APPLICATION->SetTitle(Loc::getMessage('CLU_REDIS_LIST_TITLE'));
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');

$params = [
	'ACTION_PANEL' => false,
	'SHOW_TOTAL_COUNTER' => false,
];

$lAdmin->DisplayList($params);

echo BeginNote(), Loc::getMessage('CLU_REDIS_LIST_NOTE'), EndNote();
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php');
?>