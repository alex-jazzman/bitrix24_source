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

$arServer = CClusterMemcache::GetByID($_REQUEST['ID']);

$group_id = intval($_REQUEST['group_id']);
if (is_array($arServer) && $arServer['GROUP_ID'] != $group_id)
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('CLU_MEMCACHE_EDIT_TAB'),
		'ICON' => 'main_user_edit',
		'TITLE' => GetMessage('CLU_MEMCACHE_EDIT_TAB_TITLE'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

$message = null;
$ID = intval($_REQUEST['ID'] ?? 0);
$strError = '';
$bVarsFromForm = false;

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
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && check_bitrix_sessid())
{
	if (
		(isset($_REQUEST['save']) && $_REQUEST['save'] != '')
		|| (isset($_REQUEST['apply']) && $_REQUEST['apply'] != '')
	)
	{
		$ob = new CClusterMemcache;
		$arFields = [
			'GROUP_ID' => $group_id,
			'HOST' => $_POST['HOST'],
			'PORT' => $_POST['PORT'],
			'WEIGHT' => $_POST['WEIGHT'],
		];

		if (is_array($arServer))
		{
			$res = $ob->Update($arServer['ID'], $arFields);
		}
		else
		{
			$res = $ob->Add($arFields);
		}

		if ($res)
		{
			if (isset($_REQUEST['apply']) && $_REQUEST['apply'] != '')
			{
				LocalRedirect('/bitrix/admin/cluster_memcache_edit.php?ID=' . $res . '&lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&' . $tabControl->ActiveTabParam());
			}
			else
			{
				LocalRedirect('/bitrix/admin/cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id);
			}
		}
		else
		{
			if ($e = $APPLICATION->GetException())
			{
				$message = new CAdminMessage(GetMessage('CLU_MEMCACHE_EDIT_SAVE_ERROR'), $e);
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
elseif (is_array($arServer))
{
	$str_HOST = htmlspecialcharsbx($arServer['HOST']);
	$str_PORT = htmlspecialcharsbx($arServer['PORT']);
	$str_WEIGHT = htmlspecialcharsbx($arServer['WEIGHT']);
}
else
{
	$str_HOST = '';
	$str_PORT = '11211';
	$str_WEIGHT = '100';
	if (!CCluster::checkForServers(1))
	{
		$message = new CAdminMessage(['MESSAGE' => GetMessage('CLUSTER_SERVER_COUNT_WARNING'), 'TYPE' => 'ERROR']);
	}
}

$APPLICATION->SetTitle(is_array($arServer) ? GetMessage('CLU_MEMCACHE_EDIT_EDIT_TITLE') : GetMessage('CLU_MEMCACHE_EDIT_NEW_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$arMemcacheServers = CClusterMemcache::LoadConfig();
if ($ID == 0 && count($arMemcacheServers) > 0)
{
	echo BeginNote(), GetMessage('CLU_MEMCACHE_EDIT_WARNING', ['#link#' => 'perfmon_panel.php?lang=' . LANGUAGE_ID]), EndNote();
}

$aMenu = [
	[
		'TEXT' => GetMessage('CLU_MEMCACHE_EDIT_MENU_LIST'),
		'TITLE' => GetMessage('CLU_MEMCACHE_EDIT_MENU_LIST_TITLE'),
		'LINK' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
		'ICON' => 'btn_list',
	]
];
$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($message)
{
	echo $message->Show();
}

?>
<form method="POST" action="<?php echo $APPLICATION->GetCurPage()?>"  enctype="multipart/form-data" name="editform" id="editform">
<?php
$tabControl->Begin();
?>
<?php
$tabControl->BeginNextTab();
?>
	<?php if (is_array($arServer)):?>
		<tr>
			<td><?php echo GetMessage('CLU_MEMCACHE_EDIT_ID')?>:</td>
			<td><?php echo intval($arServer['ID']);?></td>
		</tr>
	<?php endif?>
	<tr>
		<td width="40%"><?php echo GetMessage('CLU_MEMCACHE_EDIT_HOST')?>:</td>
		<td width="60%"><input type="text" size="20" name="HOST" value="<?php echo $str_HOST?>"></td>
	</tr>
	<tr>
		<td><?php echo GetMessage('CLU_MEMCACHE_EDIT_PORT')?>:</td>
		<td><input type="text" size="6" name="PORT" value="<?php echo $str_PORT?>"></td>
	</tr>
	<tr>
		<td><?php echo GetMessage('CLU_MEMCACHE_EDIT_WEIGHT')?>:</td>
		<td><input type="text" size="6" name="WEIGHT" value="<?php echo $str_WEIGHT?>"></td>
	</tr>
<?php
$tabControl->Buttons(
	[
		'back_url' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
	]
);
?>
<?php echo bitrix_sessid_post();?>
<input type="hidden" name="lang" value="<?php echo LANGUAGE_ID?>">
<input type="hidden" name="group_id" value="<?php echo $group_id?>">
<?php if (is_array($arServer)):?>
	<input type="hidden" name="ID" value="<?php echo intval($arServer['ID'])?>">
<?php endif;?>
<?php
$tabControl->End();
?>
</form>
<?php
$tabControl->ShowWarnings('editform', $message);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
