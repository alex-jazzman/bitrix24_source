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
 */

use Bitrix\Main\UrlRewriter;

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

define('HELP_FILE', 'settings/urlrewrite_edit.php');

if (!$USER->CanDoOperation('edit_php') && !$USER->CanDoOperation('view_other_settings'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$isAdmin = $USER->CanDoOperation('edit_php');

IncludeModuleLangFile(__FILE__);

$aMsg = [];
$message = null;
$bVarsFromForm = false;

$siteId = (string)($_REQUEST['site_id'] ?? '');
if ($siteId == '')
{
	LocalRedirect('/bitrix/admin/urlrewrite_list.php?lang=' . LANGUAGE_ID);
}

$condition = (string)($_REQUEST['CONDITION'] ?? '');

if ($_SERVER['REQUEST_METHOD'] == 'POST' && !empty($_POST['Update']) && $isAdmin && check_bitrix_sessid())
{
	if ($condition == '')
	{
		$aMsg[] = ['id' => 'CONDITION', 'text' => GetMessage('MURL_NO_USL')];
	}

	$conditionOld = (string)($_POST['CONDITION_OLD'] ?? '');

	if (empty($aMsg) && $conditionOld != $condition)
	{
		$arResult = UrlRewriter::getList($siteId, ['CONDITION' => $condition]);
		if (!empty($arResult))
		{
			$aMsg[] = [
				'id' => 'CONDITION',
				'text' => str_replace('#CONDITION#', htmlspecialcharsbx($condition), GetMessage('MURL_DUPL_CONDITION')),
			];
		}
	}

	if (empty($aMsg))
	{
		$arFields = [
			'CONDITION' => $condition,
			'ID' => $_POST['ID'] ?? '',
			'PATH' => $_POST['PATH'] ?? '',
			'RULE' => $_POST['RULE'] ?? '',
		];

		if ($conditionOld != '')
		{
			UrlRewriter::update($siteId, ['CONDITION' => $conditionOld], $arFields);
		}
		else
		{
			UrlRewriter::add($siteId, $arFields);
		}
	}

	if (empty($aMsg))
	{
		if (empty($_POST['apply']))
		{
			LocalRedirect('/bitrix/admin/urlrewrite_list.php?lang=' . LANGUAGE_ID . '&filter_site_id=' . urlencode($siteId) . '&' . GetFilterParams('filter_', false));
		}
	}
	else
	{
		$message = new CAdminMessage(GetMessage('SAE_ERROR'), new CAdminException($aMsg));
		$bVarsFromForm = true;
	}
}

$urlRewriteData = [
	'CONDITION_OLD' => '',
	'CONDITION' => '',
	'ID' => '',
	'PATH' => '',
	'RULE' => '',
];

$urlRewriteList = UrlRewriter::getList($siteId, ['CONDITION' => $condition]);
if (!empty($urlRewriteList))
{
	$urlRewrite = $urlRewriteList[0];
	foreach ($urlRewriteData as $key => $value)
	{
		$urlRewriteData[$key] = $urlRewrite[$key] ?? $value;
	}
	$urlRewriteData['CONDITION_OLD'] = $urlRewriteData['CONDITION'];
}

if ($bVarsFromForm)
{
	foreach ($urlRewriteData as $key => $value)
	{
		if (isset($_POST[$key]))
		{
			$urlRewriteData[$key] = $_POST[$key];
		}
	}
}

$isExistingRule = ($urlRewriteData['CONDITION_OLD'] != '');

$APPLICATION->SetTitle($isExistingRule ? GetMessage('MURL_EDIT') : GetMessage('MURL_ADD'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('MURL_2_LIST'),
		'LINK' => '/bitrix/admin/urlrewrite_list.php?lang=' . LANGUAGE_ID . '&filter_site_id=' . urlencode($siteId) . '&' . GetFilterParams('filter_', false),
		'ICON' => 'btn_list',
		'TITLE' => GetMessage('MURL_2_LIST_ALT'),
	],
];

if ($isExistingRule)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];

	$aMenu[] = [
		'TEXT' => GetMessage('MURL_ACT_ADD'),
		'LINK' => '/bitrix/admin/urlrewrite_edit.php?lang=' . LANGUAGE_ID . '&site_id=' . urlencode($siteId) . '&' . GetFilterParams('filter_', false),
		'ICON' => 'btn_new',
		'TITLE' => GetMessage('MURL_ACT_ADD_ALT'),
	];

	$aMenu[] = [
		'TEXT' => GetMessage('MURL_ACT_DEL'),
		'LINK' => "javascript:if(confirm('" . GetMessage('MURL_ACT_DEL_CONF') . "')) window.location='/bitrix/admin/urlrewrite_list.php?ID=" . urlencode(urlencode($urlRewriteData['CONDITION_OLD'])) . '&filter_site_id=' . urlencode(urlencode($siteId)) . '&action=delete&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "';",
		'WARNING' => 'Y',
		'ICON' => 'btn_delete',
	];
}
$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($message)
{
	echo $message->Show();
}
?>

<form method="POST" action="<?= $APPLICATION->GetCurPage() ?>" name="form1">
<input type="hidden" name="Update" value="Y">
<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
<input type="hidden" name="site_id" value="<?= htmlspecialcharsbx($siteId) ?>">
<input type="hidden" name="CONDITION_OLD" value="<?= htmlspecialcharsbx($urlRewriteData['CONDITION_OLD']) ?>">
<?= bitrix_sessid_post() ?>

<?php
$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('MURL_TAB'),
		'TITLE' => GetMessage('MURL_TAB_ALT'),
	],
];

$tabControl = new CAdminTabControl('tabControl', $aTabs);
$tabControl->Begin();
$tabControl->BeginNextTab();
?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?= GetMessage('MURL_USL') ?>:</td>
		<td width="60%">
			<input type="text" name="CONDITION" size="50" maxlength="250" value="<?= htmlspecialcharsbx($urlRewriteData['CONDITION']) ?>">
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('MURL_COMPONENT') ?>:</td>
		<td>
			<input type="text" name="ID" size="50" maxlength="250" value="<?= htmlspecialcharsbx($urlRewriteData['ID']) ?>">
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('MURL_FILE') ?>:</td>
		<td>
			<input type="text" name="PATH" size="50" maxlength="250" value="<?= htmlspecialcharsbx($urlRewriteData['PATH']) ?>">
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('MURL_RULE') ?>:</td>
		<td>
			<input type="text" name="RULE" size="50" maxlength="250" value="<?= htmlspecialcharsbx($urlRewriteData['RULE']) ?>">
		</td>
	</tr>
<?php
$tabControl->EndTab();

$tabControl->Buttons([
	'disabled' => !$isAdmin,
	'back_url' => '/bitrix/admin/urlrewrite_list.php?lang=' . LANGUAGE_ID . '&filter_site_id=' . urlencode($siteId) . '&' . GetFilterParams('filter_', false),
]);
$tabControl->End();
?>
</form>
<?php
$tabControl->ShowWarnings('form1', $message);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
