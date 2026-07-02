<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 */

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

define('HELP_FILE', 'utilities/agent_edit.php');

if (!$USER->CanDoOperation('view_other_settings'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$isAdmin = $USER->CanDoOperation('edit_php');

IncludeModuleLangFile(__FILE__);

$ID = (int)($_REQUEST['ID'] ?? 0);

$aTabs = [
	[
		'DIV' => 'tab1',
		'TAB' => GetMessage('MAIN_AGENT_TAB'),
		'ICON' => 'main_user_edit',
		'TITLE' => GetMessage('MAIN_AGENT_TAB_TITLE')
	],
];
$editTab = new CAdminTabControl('editTab', $aTabs);

$APPLICATION->ResetException();

if ($_SERVER['REQUEST_METHOD'] == 'POST' && (!empty($_POST['save']) || !empty($_POST['apply'])) && $isAdmin && check_bitrix_sessid())
{
	$arFields = [
		'NAME' => $_POST['NAME'] ?? '',
		'MODULE_ID' => $_POST['MODULE_ID'] ?? '',
		'ACTIVE' => $_POST['ACTIVE'] ?? '',
		'SORT' => $_POST['SORT'] ?? '',
		'IS_PERIOD' => $_POST['IS_PERIOD'] ?? '',
		'AGENT_INTERVAL' => $_POST['AGENT_INTERVAL'] ?? '',
		'NEXT_EXEC' => $_POST['NEXT_EXEC'] ?? '',
		'USER_ID' => false,
	];

	if (isset($_POST['USER_ID']) && (int)$_POST['USER_ID'] > 0)
	{
		$arFields['USER_ID'] = $_POST['USER_ID'];
	}

	if ($arFields['ACTIVE'] == 'Y')
	{
		$arFields['RETRY_COUNT'] = 0;
	}

	if ($ID > 0)
	{
		$res = CAgent::Update($ID, $arFields);
	}
	else
	{
		$ID = CAgent::Add($arFields);
		$res = ($ID > 0);
	}

	if ($res)
	{
		if (!empty($_POST['save']))
		{
			LocalRedirect('/bitrix/admin/agent_list.php?lang=' . LANGUAGE_ID);
		}
		elseif (!empty($_POST['apply']))
		{
			LocalRedirect('/bitrix/admin/agent_edit.php?ID=' . $ID . '&' . $editTab->ActiveTabParam() . '&lang=' . LANGUAGE_ID);
		}
	}
}

$agentData = [
	'LAST_EXEC' => '',
	'NEXT_EXEC' => '',
	'ACTIVE' => 'Y',
	'MODULE_ID' => '',
	'NAME' => '',
	'USER_ID' => '',
	'SORT' => '100',
	'IS_PERIOD' => 'N',
	'AGENT_INTERVAL' => '',
];

$checkboxes = [
	'ACTIVE' => 1,
];

if ($ID > 0)
{
	$res = CAgent::GetById($ID);
	$agent = $res->Fetch();
	if ($agent)
	{
		foreach ($agentData as $key => $value)
		{
			$agentData[$key] = $agent[$key] ?? $value;
		}
	}
	else
	{
		$ID = 0;
	}
}

$message = null;
if ($e = $APPLICATION->GetException())
{
	$message = new CAdminMessage(GetMessage('MAIN_AGENT_ERROR_SAVING'), $e);
	foreach ($agentData as $key => $value)
	{
		if (isset($_POST[$key]) || isset($checkboxes[$key]))
		{
			$agentData[$key] = $_POST[$key] ?? '';
		}
	}
}

$APPLICATION->SetTitle($ID > 0 ? GetMessage('MAIN_AGENT_EDIT_PAGE_TITLE', ['#ID#' => $ID]) : GetMessage('MAIN_AGENT_NEW_PAGE_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('MAIN_AGENT_RECORD_LIST'),
		'LINK' => '/bitrix/admin/agent_list.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_list',
		'TITLE' => GetMessage('MAIN_AGENT_RECORD_LIST_TITLE'),
	],
];
if ($ID > 0)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];
	$aMenu[] = [
		'TEXT' => GetMessage('MAIN_AGENT_NEW_RECORD'),
		'LINK' => '/bitrix/admin/agent_edit.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_new',
		'TITLE' => GetMessage('MAIN_AGENT_NEW_RECORD_TITLE'),
	];
	$aMenu[] = [
		'TEXT' => GetMessage('MAIN_AGENT_DEL_RECORD_TITLE'),
		'LINK' => "javascript:if(confirm('" . GetMessage('MAIN_AGENT_DELETE_RECORD_CONF') . "')) window.location='/bitrix/admin/agent_list.php?action=delete&ID=" . $ID . '&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "';",
		'ICON' => 'btn_delete',
		'TITLE' => GetMessage('MAIN_AGENT_DEL_RECORD_TITLE'),
	];
}
$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($message)
{
	echo $message->Show();
}
?>
<form name="f_agent" action="<?= $APPLICATION->GetCurPage() ?>?lang=<?= LANGUAGE_ID ?>" method="POST">
	<?= bitrix_sessid_post() ?>
	<?php
	$editTab->Begin();
	$editTab->BeginNextTab();
	?>
	<input type="hidden" name="ID" value="<?= $ID ?>">
	<?php if ($ID > 0): ?>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_LAST_EXEC') ?></td>
			<td><?= htmlspecialcharsbx($agentData['LAST_EXEC']) ?></td>
		</tr>
	<?php endif ?>

	<tr class="adm-detail-required-field">
		<td width="40%"><?= GetMessage('MAIN_AGENT_START_EXEC') ?>:</td>
		<td width="60%"><?= CalendarDate('NEXT_EXEC', htmlspecialcharsbx($agentData['NEXT_EXEC']), 'f_agent', 20) ?></td>
	</tr>
	<tr>
		<td><?= GetMessage('MAIN_AGENT_ACTIVE') ?></td>
		<td>
			<input type="hidden" name="ACTIVE" value="N">
			<input type="checkbox" name="ACTIVE" value="Y"<?php if ($agentData['ACTIVE'] == 'Y') echo ' checked' ?>>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('MAIN_AGENT_MODULE_ID') ?></td>
		<td><input type="text" name="MODULE_ID" size="40" value="<?= htmlspecialcharsbx($agentData['MODULE_ID']) ?>"></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?= GetMessage('MAIN_AGENT_NAME') ?></td>
		<td><input type="text" name="NAME" size="40" value="<?= htmlspecialcharsbx($agentData['NAME']) ?>"></td>
	</tr>
	<tr>
		<td><?= GetMessage('MAIN_AGENT_USER_ID') ?></td>
		<td><?= FindUserID('USER_ID', $agentData['USER_ID'], '', 'f_agent', 4) ?>
	</tr>
	<tr>
		<td><?= GetMessage('MAIN_AGENT_SORT') ?></td>
		<td><input type="text" name="SORT" size="40" value="<?= htmlspecialcharsbx($agentData['SORT']) ?>"></td>
	</tr>
	<tr>
		<td class="adm-detail-valign-top"><?= GetMessage('MAIN_AGENT_PERIODICAL1') ?></td>
		<td>
			<label><input type="radio" name="IS_PERIOD" value="N"<?php if ($agentData['IS_PERIOD'] != 'Y') echo ' checked' ?>><?= GetMessage('MAIN_AGENT_PERIODICAL_INTERVAL') ?></label><br>
			<label><input type="radio" name="IS_PERIOD" value="Y"<?php if ($agentData['IS_PERIOD'] == 'Y') echo ' checked' ?>><?= GetMessage('MAIN_AGENT_PERIODICAL_TIME') ?></label>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('MAIN_AGENT_INTERVAL') ?></td>
		<td><input type="text" name="AGENT_INTERVAL" size="40" value="<?= htmlspecialcharsbx($agentData['AGENT_INTERVAL']) ?>"></td>
	</tr>

	<?php
	$editTab->Buttons(['disabled' => !$isAdmin, 'back_url' => 'agent_list.php?lang=' . LANGUAGE_ID]);
	$editTab->End();
	?>
</form>
<?php
$editTab->ShowWarnings('f_agent', $message);

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
