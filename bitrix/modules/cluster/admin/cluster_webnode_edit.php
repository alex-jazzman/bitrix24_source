<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';
/** @global CUser $USER */
global $USER;
/** @global CMain $APPLICATION */
global $APPLICATION;
/** @global CDatabase $DB */
global $DB;
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/cluster/prolog.php';
IncludeModuleLangFile(__FILE__);

if (!$USER->isAdmin())
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$group_id = intval($_REQUEST['group_id'] ?? 0);
if (!CClusterGroup::GetArrayByID($group_id))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('CLU_WEBNODE_EDIT_TAB'),
		'ICON' => 'main_user_edit',
		'TITLE' => GetMessage('CLU_WEBNODE_EDIT_TAB_TITLE'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

$ID = intval($_REQUEST['ID'] ?? 0);
$strError = '';
$bVarsFromForm = false;
$message = null;

if ($_SERVER['REQUEST_METHOD'] == 'POST' && check_bitrix_sessid())
{
	if (
		(isset($_REQUEST['save']) && $_REQUEST['save'] != '')
		|| (isset($_REQUEST['apply']) && $_REQUEST['apply'] != '')
	)
	{
		$ob = new CClusterWebNode;
		$arFields = [
			'NAME' => $_POST['NAME'],
			'HOST' => $_POST['HOST'],
			'PORT' => $_POST['PORT'],
			'STATUS_URL' => $_POST['STATUS_URL'],
			'DESCRIPTION' => $_POST['DESCRIPTION'],
		];

		if ($ID > 0)
		{
			$res = $ob->Update($ID, $arFields);
		}
		else
		{
			$arFields['GROUP_ID'] = $group_id;
			$res = $ID = $ob->Add($arFields);
		}

		if ($res)
		{
			if (isset($_REQUEST['apply']) && $_REQUEST['apply'] != '')
			{
				LocalRedirect('/bitrix/admin/cluster_webnode_edit.php?ID=' . $ID . '&lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&' . $tabControl->ActiveTabParam());
			}
			else
			{
				LocalRedirect('/bitrix/admin/cluster_webnode_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id);
			}
		}
		else
		{
			if ($e = $APPLICATION->GetException())
			{
				$message = new CAdminMessage(GetMessage('CLU_WEBNODE_EDIT_SAVE_ERROR'), $e);
			}
			$bVarsFromForm = true;
		}
	}
	elseif ((isset($_REQUEST['delete']) && $_REQUEST['delete'] != '') && $ID > 1)
	{
		$res = CClusterDBNode::Delete($ID);
		if ($res)
		{
			LocalRedirect('/bitrix/admin/cluster_dbnode_list.php?lang=' . LANG . '&group_id=' . $group_id);
		}
		else
		{
			$bVarsFromForm = true;
		}
	}
}

ClearVars('str_');
$str_NAME = '';
$str_DESCRIPTION = '';
$str_HOST = '';
$str_PORT = '80';
$str_STATUS_URL = '/server-status';

if ($ID > 0)
{
	$rs = CClusterWebNode::GetList([], ['=ID' => $ID, '=GROUP_ID' => $group_id], []);
	if (!$rs->ExtractFields('str_'))
	{
		$ID = 0;
	}
}

if ($ID <= 0)
{
	if (!CCluster::checkForServers(1))
	{
		$message = new CAdminMessage(['MESSAGE' => GetMessage('CLUSTER_SERVER_COUNT_WARNING'), 'TYPE' => 'ERROR']);
	}
}

if ($bVarsFromForm)
{
	$DB->InitTableVarsForEdit('b_cluster_webnode', '', 'str_');
}

$APPLICATION->SetTitle(($ID > 0 ? GetMessage('CLU_WEBNODE_EDIT_EDIT_TITLE') : GetMessage('CLU_WEBNODE_EDIT_ADD_TITLE')));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('CLU_WEBNODE_EDIT_MENU_LIST'),
		'TITLE' => GetMessage('CLU_WEBNODE_EDIT_MENU_LIST_TITLE'),
		'LINK' => 'cluster_webnode_list.php?lang=' . LANG . '&group_id=' . $group_id,
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
	<?php if ($ID > 0):?>
		<tr>
			<td><?php echo GetMessage('CLU_WEBNODE_EDIT_ID')?>:</td>
			<td><?php echo $ID;?></td>
		</tr>
	<?php endif?>
	<tr>
		<td width="40%"><?php echo GetMessage('CLU_WEBNODE_EDIT_NAME')?>:</td>
		<td width="60%"><input type="text" size="40" name="NAME" value="<?php echo $str_NAME?>"></td>
	</tr>
	<tr>
		<td><?php echo GetMessage('CLU_WEBNODE_EDIT_HOST')?>:</td>
		<td><input type="text" size="20" name="HOST" value="<?php echo $str_HOST?>"></td>
	</tr>
	<tr>
		<td><?php echo GetMessage('CLU_WEBNODE_EDIT_PORT')?>:</td>
		<td><input type="text" size="6" name="PORT" value="<?php echo $str_PORT?>"></td>
	</tr>
	<tr>
		<td><?php echo GetMessage('CLU_WEBNODE_EDIT_STATUS_URL')?>:</td>
		<td><input type="text" size="40" name="STATUS_URL" value="<?php echo $str_STATUS_URL?>"></td>
	</tr>
	<tr>
		<td class="adm-detail-valign-top"><?php echo GetMessage('CLU_WEBNODE_EDIT_DESCRIPTION')?>:</td>
		<td><textarea cols="40" rows="10" name="DESCRIPTION"><?php echo $str_DESCRIPTION?></textarea></td>
	</tr>
<?php
$tabControl->Buttons(
	[
		'back_url' => 'cluster_webnode_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
	]
);
?>
<?php echo bitrix_sessid_post();?>
<input type="hidden" name="lang" value="<?php echo LANGUAGE_ID?>">
<input type="hidden" name="group_id" value="<?php echo $group_id?>">
<?php if ($ID > 0):?>
	<input type="hidden" name="ID" value="<?=$ID?>">
<?php endif;?>
<?php
$tabControl->End();
?>
</form>

<?php
$tabControl->ShowWarnings('editform', $message);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
