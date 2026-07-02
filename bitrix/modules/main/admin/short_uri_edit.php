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

if (!$USER->CanDoOperation('manage_short_uri') && !$USER->CanDoOperation('view_other_settings'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$message = null;
$isAdmin = $USER->CanDoOperation('manage_short_uri');

IncludeModuleLangFile(__FILE__);

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('SU_EF_tab_1'),
		'ICON' => 'main_user_edit',
		'TITLE' => GetMessage('SU_EF_tab_1_title'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

$ID = (int)($_REQUEST['ID'] ?? 0);
$bVarsFromForm = false;

if ($_SERVER['REQUEST_METHOD'] == 'POST' && (!empty($_POST['save']) || !empty($_POST['apply'])) && $isAdmin && check_bitrix_sessid())
{
	$arFields = [
		'URI' => $_POST['URI'] ?? '',
		'SHORT_URI' => $_POST['SHORT_URI'] ?? '',
		'STATUS' => $_POST['STATUS'] ?? '',
	];
	if ($ID > 0)
	{
		$res = CBXShortUri::Update($ID, $arFields);
	}
	else
	{
		$ID = CBXShortUri::Add($arFields);
		$res = ($ID > 0);
	}

	if ($res)
	{
		if (!empty($_POST['apply']))
		{
			LocalRedirect('/bitrix/admin/short_uri_edit.php?ID=' . $ID . '&mess=ok&lang=' . LANGUAGE_ID . '&' . $tabControl->ActiveTabParam());
		}
		else
		{
			LocalRedirect('/bitrix/admin/short_uri_admin.php?lang=' . LANGUAGE_ID);
		}
	}
	else
	{
		$messageText = implode("\n", CBXShortUri::GetErrors());
		if ($messageText == '')
		{
			$messageText = GetMessage('SU_EF_save_error');
		}
		$message = new CAdminMessage($messageText);
		$bVarsFromForm = true;
	}
}

$shortUriData = [
	'SHORT_URI' => CBXShortUri::GenerateShortUri(),
	'MODIFIED' => '',
	'URI' => '',
	'STATUS' => '',
	'LAST_USED' => '',
	'NUMBER_USED' => '',
];

if (isset($_REQUEST['public']))
{
	$shortUriData['URI'] = (string)($_REQUEST['str_URI'] ?? '');
	$suri = CBXShortUri::GetList([], ['URI_EXACT' => $shortUriData['URI']]);
	if ($shortUri = $suri->Fetch())
	{
		$ID = (int)$shortUri['ID'];
	}
}

if ($ID > 0)
{
	$suri = CBXShortUri::GetList([], ['ID' => $ID]);
	$shortUri = $suri->Fetch();
	if ($shortUri)
	{
		foreach ($shortUriData as $key => $value)
		{
			$shortUriData[$key] = $shortUri[$key] ?? $value;
		}
	}
	else
	{
		$ID = 0;
	}
}

if ($bVarsFromForm)
{
	foreach ($shortUriData as $key => $value)
	{
		if (isset($_POST[$key]))
		{
			$shortUriData[$key] = $_POST[$key];
		}
	}
}

$APPLICATION->SetTitle($ID > 0 ? GetMessage('SU_EF_title_edit') . $ID : GetMessage('SU_EF_title_add'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('SU_EF_list_text'),
		'TITLE' => GetMessage('SU_EF_list'),
		'LINK' => 'short_uri_admin.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_list',
	],
];
if ($ID > 0)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];
	$aMenu[] = [
		'TEXT' => GetMessage('SU_EF_add_text'),
		'TITLE' => GetMessage('SU_EF_mnu_add'),
		'LINK' => 'short_uri_edit.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_new',
	];
	$aMenu[] = [
		'TEXT' => GetMessage('SU_EF_del_text'),
		'TITLE' => GetMessage('SU_EF_mnu_del'),
		'LINK' => "javascript:if(confirm('" . GetMessage('SU_EF_mnu_del_conf') . "'))window.location='short_uri_admin.php?ID=" . $ID . '&action=delete&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "';",
		'ICON' => 'btn_delete',
	];
}
$context = new CAdminContextMenu($aMenu);
$context->Show();

if (isset($_REQUEST['mess']) && $_REQUEST['mess'] == 'ok' && $ID > 0)
{
	CAdminMessage::ShowMessage(['MESSAGE' => GetMessage('SU_EF_saved'), 'TYPE' => 'OK']);
}
if ($message)
{
	echo $message->Show();
}
?>

<form method="POST" action="<?= $APPLICATION->GetCurPage() ?>" enctype="multipart/form-data" name="short_uri_form">
	<?php
	$tabControl->Begin();
	$tabControl->BeginNextTab();
	?>
	<?php if ($ID > 0): ?>
		<tr>
			<td width="40%"><?= GetMessage('SU_EF_date_add') ?></td>
			<td width="60%"><?= htmlspecialcharsbx($shortUriData['MODIFIED']) ?></td>
		</tr>
	<?php endif ?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?= GetMessage('SU_EF_URI') ?></td>
		<td width="60%"><input type="text" name="URI" value="<?= htmlspecialcharsbx($shortUriData['URI']) ?>" size="70"></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?= GetMessage('SU_EF_SHORT_URI') ?></td>
		<td>
			<input
				type="text"
				name="SHORT_URI"
				value="<?= htmlspecialcharsbx($shortUriData['SHORT_URI']) ?>"
				size="70"
				onkeyup="ShortUriChangeHandler(this.value)"
			>
		</td>
	</tr>
	<tr>
		<td>&nbsp;</td>
		<td>
			<span id="id_short_uri_span"></span>
			<?php
			$request = \Bitrix\Main\Context::getCurrent()->getRequest();
			$proto = $request->isHttps() ? 'https://' : 'http://';
			$host = $request->getHttpHost();
			?>
			<script>
				function ShortUriChangeHandler(val)
				{
					var d = document.getElementById('id_short_uri_span');
					if (d) {
						d.innerHTML = '<a href="<?= $proto . $host ?>/' + BX.util.htmlspecialchars(encodeURI(val)) + '"><?= $proto . $host ?>/' + BX.util.htmlspecialchars(val) + '</a>';
					}
				}

				setTimeout(function () {
					ShortUriChangeHandler('<?= CUtil::JSEscape($shortUriData['SHORT_URI']) ?>');
				}, 10);
			</script>
		</td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?= GetMessage('SU_EF_STATUS') ?></td>
		<td><?= CBXShortUri::SelectBox('STATUS', $shortUriData['STATUS']) ?></td>
	</tr>
	<?php if ($ID > 0): ?>
		<tr>
			<td><?= GetMessage('SU_EF_LAST_USED') ?></td>
			<td><?= htmlspecialcharsbx($shortUriData['LAST_USED']) ?></td>
		</tr>
		<tr>
			<td><?= GetMessage('SU_EF_NUMBER_USED') ?></td>
			<td><?= htmlspecialcharsbx($shortUriData['NUMBER_USED']) ?></td>
		</tr>
	<?php endif ?>

	<?php
	$tabControl->Buttons(
		[
			'disabled' => !$isAdmin,
			'back_url' => 'short_uri_admin.php?lang=' . LANGUAGE_ID,
		]
	);
	?>
	<?= bitrix_sessid_post() ?>
	<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
	<?php if ($ID > 0): ?>
		<input type="hidden" name="ID" value="<?= $ID ?>">
	<?php endif; ?>
	<?php
	$tabControl->End();
	?>
</form>

<?php
$tabControl->ShowWarnings('short_uri_form', $message);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
