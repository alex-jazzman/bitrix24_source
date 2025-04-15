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

$id = intval($_REQUEST['ID'] ?? 0);
$groupID = intval($_REQUEST['group_id']);
$server = $cache::getByID($id);

if (!empty($server) && $server['GROUP_ID'] != $groupID)
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));
}

$tabs = [
	[
		'DIV' => 'edit1',
		'TAB' => Loc::getMessage('CLU_MEMCACHE_EDIT_TAB'),
		'ICON' => 'main_user_edit',
		'TITLE' => Loc::getMessage('CLU_MEMCACHE_EDIT_TAB_TITLE'),
	],
];

$tabControl = new CAdminTabControl('tabControl', $tabs);

$message = null;
$strError = '';
$bVarsFromForm = false;

if ($_SERVER['REQUEST_METHOD'] == 'POST' && check_bitrix_sessid())
{
	if (
		(isset($_REQUEST['save']) && $_REQUEST['save'] != '')
		|| (isset($_REQUEST['apply']) && $_REQUEST['apply'] != '')
	)
	{
		$ob = new $cache;
		$fields = [
			'GROUP_ID' => $groupID,
			'HOST' => $_POST['HOST'],
			'PORT' => $_POST['PORT'],
			'WEIGHT' => $_POST['WEIGHT'],
		];

		if (is_array($server) && !empty($server))
		{
			$res = $ob->Update($server['ID'], $fields);
		}
		else
		{
			$res = $ob->Add($fields);
		}

		if ($res)
		{
			if (isset($_REQUEST['apply']) && $_REQUEST['apply'] != '')
			{
				LocalRedirect('/bitrix/admin/cluster_memcache_edit.php?ID=' . $res . '&lang=' . LANGUAGE_ID . '&group_id=' . $groupID . '&' . $tabControl->ActiveTabParam());
			}
			else
			{
				LocalRedirect('/bitrix/admin/cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $groupID);
			}
		}
		else
		{
			if ($e = $APPLICATION->GetException())
			{
				$message = new CAdminMessage(Loc::getMessage('CLU_MEMCACHE_EDIT_SAVE_ERROR'), $e);
			}
			$bVarsFromForm = true;
		}
	}
}

ClearVars('str_');

if ($bVarsFromForm)
{
	$str_HOST = htmlspecialcharsbx($_REQUEST['HOST']);
	$str_PORT = htmlspecialcharsbx($_REQUEST['PORT']);
	$str_WEIGHT = htmlspecialcharsbx($_REQUEST['WEIGHT']);
}
elseif (is_array($server))
{
	$str_HOST = htmlspecialcharsbx($server['HOST']);
	$str_PORT = htmlspecialcharsbx($server['PORT']);
	$str_WEIGHT = htmlspecialcharsbx($server['WEIGHT']);
}
else
{
	$str_HOST = '';
	$str_PORT = '11211';
	$str_WEIGHT = '100';
	if (!CCluster::checkForServers(1))
	{
		$message = new CAdminMessage(['MESSAGE' => Loc::getMessage('CLUSTER_SERVER_COUNT_WARNING'), 'TYPE' => 'ERROR']);
	}
}

$APPLICATION->SetTitle(is_array($server) ? Loc::getMessage('CLU_MEMCACHE_EDIT_EDIT_TITLE') : Loc::getMessage('CLU_MEMCACHE_EDIT_NEW_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$servers = $cache::getServerList();
if ($id == 0 && count($servers) > 0)
{
	echo BeginNote(), Loc::getMessage('CLU_MEMCACHE_EDIT_WARNING', ['#link#' => 'perfmon_panel.php?lang=' . LANGUAGE_ID]), EndNote();
}

$menu = [
	[
		'TEXT' => Loc::getMessage('CLU_MEMCACHE_EDIT_MENU_LIST'),
		'TITLE' => Loc::getMessage('CLU_MEMCACHE_EDIT_MENU_LIST_TITLE'),
		'LINK' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $groupID,
		'ICON' => 'btn_list',
	]
];
$context = new CAdminContextMenu($menu);
$context->Show();

if ($message)
{
	echo $message->Show();
}

?><form method="POST" action="<?=$APPLICATION->GetCurPage()?>"  enctype="multipart/form-data" name="editform" id="editform"><?
$tabControl->Begin();
$tabControl->BeginNextTab();
if (is_array($server)):
	?><tr><?
		?><td><?=Loc::getMessage('CLU_MEMCACHE_EDIT_ID')?>:</td><?
		?><td><?=intval($server['ID']);?></td><?
	?></tr><?
endif;
?><tr><?
	?><td width="40%"><?=Loc::getMessage('CLU_MEMCACHE_EDIT_HOST')?>:</td><?
	?><td width="60%"><input type="text" size="20" name="HOST" value="<?=$str_HOST?>"></td><?
?></tr><tr><?
	?><td><?=Loc::getMessage('CLU_MEMCACHE_EDIT_PORT')?>:</td><?
	?><td><input type="text" size="6" name="PORT" value="<?=$str_PORT?>"></td><?
?></tr><tr><?
	?><td><?=Loc::getMessage('CLU_MEMCACHE_EDIT_WEIGHT')?>:</td><?
	?><td><input type="text" size="6" name="WEIGHT" value="<?=$str_WEIGHT?>"></td><?
?></tr><?

$tabControl->Buttons(['back_url' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $groupID]);
echo bitrix_sessid_post();
?><input type="hidden" name="lang" value="<?=LANGUAGE_ID?>"><input type="hidden" name="group_id" value="<?=$groupID?>"><?

if (is_array($server)):
	?><input type="hidden" name="ID" value="<?=intval($server['ID'])?>"><?
endif;

$tabControl->End();
?></form><?

$tabControl->ShowWarnings('editform', $message);
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
