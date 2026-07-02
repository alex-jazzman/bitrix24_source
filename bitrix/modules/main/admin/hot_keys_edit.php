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

if (!$USER->CanDoOperation('edit_other_settings'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

IncludeModuleLangFile(__FILE__);

$ID = (int)($_REQUEST['ID'] ?? 0);

$hotKeyCodes = new CHotKeysCode();

$errMess = null;
$bVarsFromForm = false;

if ($_SERVER['REQUEST_METHOD'] == 'POST' && (!empty($_POST['save']) || !empty($_POST['apply'])) && check_bitrix_sessid())
{
	$arFields = [
		'CLASS_NAME' => $_POST['CLASS_NAME'] ?? '',
		'CODE' => $_POST['CODE'] ?? '',
		'NAME' => $_POST['NAME'] ?? '',
		'COMMENTS' => $_POST['COMMENTS'] ?? '',
		'TITLE_OBJ' => $_POST['TITLE_OBJ'] ?? '',
		'URL' => $_POST['URL'] ?? '',
	];

	if ($ID > 0)
	{
		$res = $hotKeyCodes->Update($ID, $arFields);
	}
	else
	{
		$ID = $hotKeyCodes->Add($arFields);
		$res = ($ID > 0);
	}

	if ($res)
	{
		if (isset($_POST['apply']))
		{
			LocalRedirect('hot_keys_edit.php?ID=' . $ID . '&lang=' . LANGUAGE_ID . '&applied=ok');
		}
		else
		{
			LocalRedirect(!empty($_POST['addhk']) ? $_POST['addhk'] : 'hot_keys_list.php?lang=' . LANGUAGE_ID);
		}
	}
	else
	{
		if ($e = $APPLICATION->GetException())
		{
			$errMess = new CAdminMessage(GetMessage('HK_EDIT_ERROR'), $e);
		}
		else
		{
			$errMess = new CAdminMessage(GetMessage('HK_EDIT_ERROR'));
		}

		$bVarsFromForm = true;
	}
}

$hotKeyData = [
	'ID' => '',
	'IS_CUSTOM' => true,
	'NAME' => '',
	'CODE' => '',
	'CLASS_NAME' => '',
	'COMMENTS' => '',
	'TITLE_OBJ' => '',
	'URL' => '',
];

if ($ID > 0)
{
	$hotKey = $hotKeyCodes->GetByID($ID)->Fetch();
	if ($hotKey)
	{
		foreach ($hotKeyData as $key => $value)
		{
			$hotKeyData[$key] = $hotKey[$key] ?? $value;
		}
	}
	else
	{
		$ID = 0;
	}
}

if ($bVarsFromForm)
{
	foreach ($hotKeyData as $key => $value)
	{
		if (isset($_POST[$key]))
		{
			$hotKeyData[$key] = $_POST[$key];
		}
	}
}

$sDocTitle = ($ID > 0 ? GetMessage('HK_EDIT_RECORD', ['#ID#' => $ID]) : GetMessage('HK_NEW_RECORD'));

$APPLICATION->SetTitle($sDocTitle);

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('HK_LIST'),
		'TITLE' => GetMessage('HK_LIST_TITLE'),
		'LINK' => 'hot_keys_list.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_list',
	],
];
if ($ID > 0)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];
	$aMenu[] = [
		'TEXT' => GetMessage('HK_ADD'),
		'TITLE' => GetMessage('HK_ADD_TITLE'),
		'LINK' => 'hot_keys_edit.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_new',
	];

	if ($hotKeyData['IS_CUSTOM'])
	{
		$aMenu[] = [
			'TEXT' => GetMessage('HK_DELETE'),
			'TITLE' => GetMessage('HK_DELETE_TITLE'),
			'LINK' => "javascript:if(confirm('" . GetMessage('HK_DEL_CONFIRM') . "')) window.location='hot_keys_list.php?ID=" . $ID . '&action=delete&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "';",
			'ICON' => 'btn_delete',
		];
	}
}
$context = new CAdminContextMenu($aMenu);
$context->Show();

if (isset($_GET['applied']) && $_GET['applied'] == 'ok')
{
	CAdminMessage::ShowMessage(['MESSAGE' => GetMessage('HK_EDIT_SUCCESS'), 'TYPE' => 'OK']);
}

if ($errMess)
{
	echo $errMess->Show();
}

$aTabs = [
	['DIV' => 'edit1', 'TAB' => GetMessage('HK_EDIT_TAB'), 'TITLE' => GetMessage('HK_EDIT_TAB_TITLE')],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

?>
<form method="POST" action="<?= $APPLICATION->GetCurPage() ?>" name="hkform">
<?= bitrix_sessid_post() ?>
<input type="hidden" name="ID" value="<?= (int)$ID ?>">
<input type="hidden" name="IS_CUSTOM" value="<?= htmlspecialcharsbx((string)$hotKeyData['IS_CUSTOM']) ?>">
<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
<?php if (!empty($_REQUEST['addhk'])): ?>
<input type="hidden" name="addhk" value="<?= htmlspecialcharsbx($_REQUEST['addhk']) ?>">
<?php endif; ?>
<?php
$tabControl->Begin();
$tabControl->BeginNextTab();
?>
<?php if ($hotKeyData['ID']): ?>
	<tr>
		<td><?= GetMessage('HK_ID') ?>:</td>
		<td><?= (int)$hotKeyData['ID'] ?></td>
	</tr>
<?php endif; ?>
	<tr class="adm-detail-required-field">
		<td><?= GetMessage('HK_NAME') ?>:</td>
		<td><input type="text" name="NAME" size="45" maxlength="255" value="<?= htmlspecialcharsbx($hotKeyData['IS_CUSTOM'] ? $hotKeyData['NAME'] : GetMessage($hotKeyData['NAME'])) ?>"<?= $hotKeyData['IS_CUSTOM'] ? '' : ' disabled' ?>></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td class="adm-detail-valign-top"><?= GetMessage('HK_CODE') ?>:</td>
		<td><textarea name="CODE" rows="5" cols="50" maxlength="255"<?= $hotKeyData['IS_CUSTOM'] ? '' : ' disabled' ?>><?= htmlspecialcharsbx($hotKeyData['CODE']) ?></textarea></td>
	</tr>
	<tr>
		<td><?= GetMessage('HK_CLASS_NAME') ?>:</td>
		<td><input type="text" name="CLASS_NAME" size="45" maxlength="255" value="<?= htmlspecialcharsbx($hotKeyData['CLASS_NAME']) ?>"<?= $hotKeyData['IS_CUSTOM'] ? '' : ' disabled' ?>></td>
	</tr>
	<tr>
		<td><?= GetMessage('HK_COMMENTS') ?>:</td>
		<td><input type="text" name="COMMENTS" size="45" maxlength="255" value="<?= htmlspecialcharsbx($hotKeyData['IS_CUSTOM'] ? $hotKeyData['COMMENTS'] : GetMessage($hotKeyData['COMMENTS'])) ?>"<?= $hotKeyData['IS_CUSTOM'] ? '' : ' disabled' ?>></td>
	</tr>
	<tr>
		<td><?= GetMessage('HK_TITLE_OBJ') ?>:</td>
		<td><input type="text" name="TITLE_OBJ" size="45" maxlength="255" value="<?= htmlspecialcharsbx($hotKeyData['TITLE_OBJ']) ?>"<?= $hotKeyData['IS_CUSTOM'] ? '' : ' disabled' ?>></td>
	</tr>
	<tr>
		<td><?= GetMessage('HK_URL') ?>:</td>
		<td><input type="text" name="URL" size="45" maxlength="255" value="<?= htmlspecialcharsbx($hotKeyData['URL']) ?>"<?= $hotKeyData['IS_CUSTOM'] ? '' : ' disabled' ?>></td>
	</tr>
<?php
$tabControl->Buttons([
	'disabled' => !$hotKeyData['IS_CUSTOM'],
	'back_url' => (!empty($_REQUEST['addhk']) ? $_REQUEST['addhk'] : 'hot_keys_list.php?lang=' . LANGUAGE_ID),
]);
$tabControl->End();
?>
</form>
<?php
$tabControl->ShowWarnings('hkform', $errMess);

require_once $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
