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

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('CLU_GROUP_EDIT_TAB'),
		'ICON' => 'main_user_edit',
		'TITLE' => GetMessage('CLU_GROUP_EDIT_TAB_TITLE'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

$message = null;
$ID = intval($_REQUEST['ID'] ?? 0);
$strError = '';
$bVarsFromForm = false;

if ($_SERVER['REQUEST_METHOD'] == 'POST' && check_bitrix_sessid())
{
	if (isset($_POST['save']) || isset($_POST['apply']))
	{
		$ob = new CClusterGroup;
		$arFields = [
			'NAME' => $_POST['NAME'],
		];

		if ($ID > 0)
		{
			$res = $ob->Update($ID, $arFields);
		}
		else
		{
			$res = $ID = $ob->Add($arFields);
		}

		if ($res)
		{
			if (isset($_POST['apply']))
			{
				LocalRedirect('/bitrix/admin/cluster_group_edit.php?ID=' . $ID . '&lang=' . LANG . '&' . $tabControl->ActiveTabParam());
			}
			else
			{
				LocalRedirect('/bitrix/admin/cluster_index.php?lang=' . LANG);
			}
		}
		else
		{
			if ($e = $APPLICATION->GetException())
			{
				$message = new CAdminMessage(GetMessage('CLU_GROUP_EDIT_SAVE_ERROR'), $e);
			}
			$bVarsFromForm = true;
		}
	}
	elseif ($_POST['action'] == 'delete')
	{
		$ob = new CClusterGroup;
		$res = $ob->Delete($ID);
		if ($res)
		{
			LocalRedirect('/bitrix/admin/cluster_index.php?lang=' . LANG);
		}
		else
		{
			if ($e = $APPLICATION->GetException())
			{
				$message = new CAdminMessage(GetMessage('CLU_GROUP_EDIT_DELETE_ERROR'), $e);
			}
			$bVarsFromForm = true;
		}
	}
}

ClearVars('str_');
$str_NAME = '';

if ($ID > 0)
{
	$rs = CClusterGroup::GetList([], ['=ID' => $ID], []);
	if (!$rs->ExtractFields('str_'))
	{
		$ID = 0;
	}
}

if ($bVarsFromForm)
{
	$DB->InitTableVarsForEdit('b_cluster_group', '', 'str_');
}

$APPLICATION->SetTitle(($ID > 0 ? GetMessage('CLU_GROUP_EDIT_EDIT_TITLE') : GetMessage('CLU_GROUP_EDIT_ADD_TITLE')));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

if ($ID > 0)
{
	$aMenu = [
		[
			'TEXT' => GetMessage('CLU_GROUP_EDIT_DELETE'),
			'TITLE' => GetMessage('CLU_GROUP_EDIT_DELETE_TITLE'),
			'LINK' => "javascript:jsDelete('editform', '" . GetMessage('CLU_GROUP_EDIT_DELETE_CONF') . "')",
			'ICON' => 'btn_delete',
		]
	];

	$context = new CAdminContextMenu($aMenu);
	$context->Show();
}

if ($message)
{
	echo $message->Show();
}
?>
<script>
function jsDelete(form_id, message)
{
	var _form = document.getElementById(form_id);
	var _flag = document.getElementById('action');
	if(_form && _flag)
	{
		if(confirm(message))
		{
			_flag.value = 'delete';
			_form.submit();
		}
	}
}
</script>
<form method="POST" action="<?php echo $APPLICATION->GetCurPage()?>"  enctype="multipart/form-data" name="editform" id="editform">
<?php
$tabControl->Begin();
?>
<?php
$tabControl->BeginNextTab();
?>
	<?php if ($ID > 0):?>
		<tr>
			<td><?php echo GetMessage('CLU_GROUP_EDIT_ID')?>:</td>
			<td><?php echo $ID;?></td>
		</tr>
	<?php endif?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?php echo GetMessage('CLU_GROUP_EDIT_NAME')?>:</td>
		<td width="60%"><input type="text" size="40" name="NAME" value="<?php echo $str_NAME?>"></td>
	</tr>
<?php
$tabControl->Buttons(
	[
		'back_url' => 'cluster_index.php?lang=' . LANG,
	]
);
?>
<?php echo bitrix_sessid_post();?>
<input type="hidden" name="lang" value="<?php echo LANG?>">
<input type="hidden" name="action" id="action" value="">
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
