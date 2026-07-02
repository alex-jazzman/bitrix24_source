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

use Bitrix\Main\Application;

require_once __DIR__ . '/../include/prolog_admin_before.php';

define('HELP_FILE', 'favorites/favorite_edit.php');

function UserInfo($USER_ID)
{
	if ((int)$USER_ID <= 0)
	{
		return '';
	}

	$user = CUser::GetByID($USER_ID);
	if ($user_arr = $user->Fetch())
	{
		return '[<a title="' . GetMessage('MAIN_USER_PROFILE') . '" ' . 'href="user_edit.php?ID=' . $user_arr['ID'] . '&amp;lang=' . LANGUAGE_ID . '">' . $user_arr['ID'] . '</a>] '
			. '(' . htmlspecialcharsbx($user_arr['LOGIN']) . ') ' . htmlspecialcharsbx($user_arr['NAME']) . ' ' . htmlspecialcharsbx($user_arr['LAST_NAME'])
		;
	}

	return '';
}

if (
	!$USER->CanDoOperation('edit_own_profile')
	&& !$USER->CanDoOperation('edit_other_settings')
	&& !$USER->CanDoOperation('view_other_settings')
)
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$isAdmin = $USER->CanDoOperation('edit_other_settings');

IncludeModuleLangFile(__FILE__);

$ID = (int)($_REQUEST['ID'] ?? 0);
$requestName = $_REQUEST['name'] ?? '';
$addUrl = $_REQUEST['addurl'] ?? '';
$message = null;
$bVarsFromForm = false;
$session = Application::getInstance()->getSession();

if ($ID > 0 && !$isAdmin)
{
	$db_fav = CFavorites::GetByID($ID);
	if (($db_fav_arr = $db_fav->Fetch()) && $USER->GetID() != $db_fav_arr['USER_ID'])
	{
		CAdminMessage::ShowMessage([
			'MESSAGE' => GetMessage('fav_edit_access_error'),
			'DETAILS' => GetMessage('fav_edit_access_error_mess'),
		]);
		require_once $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
	}
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && (!empty($_POST['save']) || !empty($_POST['apply'])) && check_bitrix_sessid())
{
	$arFields = [
		'C_SORT' => $_POST['C_SORT'] ?? '',
		'~TIMESTAMP_X' => $DB->GetNowFunction(),
		'MODIFIED_BY' => $USER->GetID(),
		'NAME' => $_POST['NAME'] ?? '',
		'URL' => $_POST['URL'] ?? '',
		'MENU_ID' => $_POST['MENU_ID'] ?? '',
		'COMMENTS' => $_POST['COMMENTS'] ?? '',
		'LANGUAGE_ID' => $_POST['LANGUAGE_ID'] ?? '',
	];

	if ($ID == 0)
	{
		$arFields['COMMON'] = 'N';
		$arFields['USER_ID'] = $USER->GetID();
		$arFields['~DATE_CREATE'] = $DB->GetNowFunction();
		$arFields['CREATED_BY'] = $USER->GetID();
	}

	if ($isAdmin)
	{
		$arFields['COMMON'] = (($_POST['COMMON'] ?? '') == 'Y' ? 'Y' : 'N');
		$arFields['USER_ID'] = ($arFields['COMMON'] == 'Y' ? false : ($_POST['USER_ID'] ?? ''));
		$arFields['MODULE_ID'] = ($arFields['COMMON'] == 'Y' && ($_POST['MODULE_ID'] ?? '') != '' ? $_POST['MODULE_ID'] : false);
	}

	if ($ID > 0)
	{
		$res = CFavorites::Update($ID, $arFields);
	}
	else
	{
		$ID = CFavorites::Add($arFields);
		$res = ($ID > 0);
	}

	if ($res)
	{
		if (!empty($_POST['apply']))
		{
			$session['SESS_ADMIN']['FAVORITES_EDIT_MESSAGE'] = ['MESSAGE' => GetMessage('fav_edit_success'), 'TYPE' => 'OK'];
			LocalRedirect('favorite_edit.php?ID=' . $ID . '&lang=' . LANGUAGE_ID);
		}
		else
		{
			LocalRedirect(($addUrl != '' ? $addUrl : 'favorite_list.php?lang=' . LANGUAGE_ID));
		}
	}
	else
	{
		if ($e = $APPLICATION->GetException())
		{
			$message = new CAdminMessage(GetMessage('fav_edit_error'), $e);
		}
		$bVarsFromForm = true;
	}
}

$favoriteData = [
	'TIMESTAMP_X' => '',
	'MODIFIED_BY' => '',
	'DATE_CREATE' => '',
	'CREATED_BY' => '',
	'NAME' => $requestName,
	'URL' => $addUrl,
	'C_SORT' => '100',
	'COMMON' => 'N',
	'USER_ID' => $USER->GetID(),
	'LANGUAGE_ID' => LANGUAGE_ID,
	'MENU_ID' => '',
	'COMMENTS' => '',
	'MODULE_ID' => '',
];

$checkboxes = [
	'COMMON' => 1,
];

if ($ID > 0)
{
	$fav = CFavorites::GetByID($ID);
	$fav_arr = $fav->Fetch();
	if ($fav_arr)
	{
		foreach ($favoriteData as $key => $value)
		{
			$favoriteData[$key] = $fav_arr[$key] ?? $value;
		}
	}
	else
	{
		$ID = 0;
	}
}

if ($bVarsFromForm)
{
	foreach ($favoriteData as $key => $value)
	{
		if (isset($_POST[$key]) || isset($checkboxes[$key]))
		{
			$favoriteData[$key] = $_POST[$key] ?? '';
		}
	}
}

$APPLICATION->SetTitle($ID > 0 ? GetMessage('MAIN_EDIT_RECORD', ['#ID#' => $ID]) : GetMessage('MAIN_NEW_RECORD'));

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('MAIN_RECORDS_LIST'),
		'TITLE' => GetMessage('fav_edit_list_title'),
		'LINK' => 'favorite_list.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_list',
	],
];
if ($ID > 0)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];
	$aMenu[] = [
		'TEXT' => GetMessage('fav_edit_add'),
		'TITLE' => GetMessage('fav_edit_add_title'),
		'LINK' => 'favorite_edit.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_new',
	];
	$aMenu[] = [
		'TEXT' => GetMessage('fav_edit_del'),
		'TITLE' => GetMessage('fav_edit_del_title'),
		'LINK' => "javascript:if(confirm('" . GetMessage('fav_edit_del_conf') . "')) window.location='favorite_list.php?ID=" . $ID . '&action=delete&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "';",
		'ICON' => 'btn_delete',
	];
}
$context = new CAdminContextMenu($aMenu);
$context->Show();

if (is_array($session['SESS_ADMIN']['FAVORITES_EDIT_MESSAGE']))
{
	CAdminMessage::ShowMessage($session['SESS_ADMIN']['FAVORITES_EDIT_MESSAGE']);
	$session['SESS_ADMIN']['FAVORITES_EDIT_MESSAGE'] = false;
}

if ($message)
{
	echo $message->Show();
}

$aTabs = [
	['DIV' => 'edit1', 'TAB' => GetMessage('fav_edit_tab'), 'TITLE' => GetMessage('fav_edit_tab_title')],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

?>
<form method="POST" action="<?= $APPLICATION->GetCurPage() ?>" name="favform">
<?= bitrix_sessid_post() ?>
<input type="hidden" name="ID" value="<?= $ID ?>">
<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
<?php if ($addUrl != ''): ?>
<input type="hidden" name="addurl" value="<?= htmlspecialcharsbx($addUrl) ?>">
<?php endif; ?>
<?php
$tabControl->Begin();
$tabControl->BeginNextTab();
?>
	<?php if ($favoriteData['TIMESTAMP_X'] != ''): ?>
	<tr>
		<td><?= GetMessage('MAIN_TIMESTAMP_X') ?></td>
		<td><?= htmlspecialcharsbx($favoriteData['TIMESTAMP_X']) ?> / <?= UserInfo($favoriteData['MODIFIED_BY']) ?></td>
	</tr>
	<?php endif; ?>
	<?php if ($favoriteData['DATE_CREATE'] != ''): ?>
	<tr>
		<td><?= GetMessage('MAIN_CREATED') ?></td>
		<td><?= htmlspecialcharsbx($favoriteData['DATE_CREATE']) ?> / <?= UserInfo($favoriteData['CREATED_BY']) ?></td>
	</tr>
	<?php endif; ?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?= GetMessage('MAIN_NAME') ?></td>
		<td width="60%"><input type="text" name="NAME" size="45" maxlength="255" value="<?= htmlspecialcharsbx($favoriteData['NAME']) ?>"></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?= GetMessage('fav_edit_link') ?></td>
		<td><input type="text" name="URL" size="45" maxlength="2000" value="<?= htmlspecialcharsbx($favoriteData['URL']) ?>"></td>
	</tr>
	<tr>
		<td><?= GetMessage('MAIN_C_SORT') ?></td>
		<td><input type="text" name="C_SORT" size="5" maxlength="18" value="<?= htmlspecialcharsbx($favoriteData['C_SORT']) ?>"></td>
	</tr>
	<tr>
		<td><?= GetMessage('fav_edit_lang') ?></td>
		<td><?= CLanguage::SelectBox('LANGUAGE_ID', $favoriteData['LANGUAGE_ID']) ?></td>
	</tr>
	<tr>
		<td width="40%"><?= GetMessage('MAIN_MENU_ID') ?></td>
		<td width="60%"><input type="text" name="MENU_ID" size="45" maxlength="255" value="<?= htmlspecialcharsbx($favoriteData['MENU_ID']) ?>"></td>
	</tr>
	<tr>
		<td class="adm-detail-valign-top"><?= GetMessage('MAIN_COMMENTS') ?></td>
		<td><textarea name="COMMENTS" class="textarea" rows="5" cols="40"><?= htmlspecialcharsbx($favoriteData['COMMENTS']) ?></textarea></td>
	</tr>
<?php if ($isAdmin): ?>
	<tr class="heading">
		<td colspan="2"><?= GetMessage('fav_edit_admin') ?></td>
	</tr>
	<tr>
		<td><?= GetMessage('fav_edit_common') ?></td>
		<td><input type="checkbox" name="COMMON" value="Y"<?php if ($favoriteData['COMMON'] == 'Y') echo ' checked' ?> onclick="EnableControls(this.checked)"></td>
	</tr>
	<tr>
		<td><?= GetMessage('fav_edit_user') ?></td>
		<td><?php
		$sUser = '';
		if ($ID > 0)
		{
			$sUser = UserInfo($favoriteData['USER_ID']);
		}
		echo FindUserID('USER_ID', ((int)$favoriteData['USER_ID'] > 0 ? $favoriteData['USER_ID'] : ''), $sUser, 'favform', '10', '', ' ... ', '', '');
		?>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('fav_edit_modules') ?></td>
		<td>
<select name="MODULE_ID">
	<option value=""><?= GetMessage('fav_edit_modules_not') ?></option>
<?php
$a = CModule::GetDropDownList();
while ($ar = $a->fetch()):
?>
	<option value="<?= htmlspecialcharsbx($ar['REFERENCE_ID']) ?>"<?php if ($ar['REFERENCE_ID'] == $favoriteData['MODULE_ID']) echo ' selected' ?>><?= htmlspecialcharsbx($ar['REFERENCE']) ?></option>
<?php endwhile ?>
</select>
<script>
function EnableControls(checked)
{
	document.favform.USER_ID.disabled = document.favform.FindUser.disabled = checked;
	document.favform.MODULE_ID.disabled = !checked;
}
EnableControls(document.favform.COMMON.checked);
</script>
		</td>
	</tr>
<?php endif; ?>
<?php
$tabControl->Buttons([
	'disabled' => false,
	'back_url' => ($addUrl != '' ? $addUrl : 'favorite_list.php?lang=' . LANGUAGE_ID),
]);
$tabControl->End();
?>
</form>

<?php
$tabControl->ShowWarnings('favform', $message);

require_once $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
