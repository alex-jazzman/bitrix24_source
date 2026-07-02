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

use Bitrix\Main\Type\Collection;

require_once __DIR__ . '/../include/prolog_admin_before.php';

define('HELP_FILE', 'users/task_edit.php');

if (!$USER->CanDoOperation('view_tasks'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

IncludeModuleLangFile(__FILE__);

$ID = (int)($_REQUEST['ID'] ?? 0);
$COPY_ID = (int)($_REQUEST['COPY_ID'] ?? 0);

if ($COPY_ID > 0)
{
	$ID = $COPY_ID;
}

$message = null;
$bVarsFromForm = false;

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('TAB_1'),
		'ICON' => '',
		'TITLE' => GetMessage('TAB_1_TITLE'),
	],
	[
		'DIV' => 'edit2',
		'TAB' => GetMessage('TAB_2'),
		'ICON' => '',
		'TITLE' => GetMessage('TAB_2_TITLE'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

if (
	$_SERVER['REQUEST_METHOD'] == 'POST'
	&& (!empty($_POST['save']) || !empty($_POST['apply']))
	&& $USER->CanDoOperation('edit_tasks')
	&& check_bitrix_sessid()
)
{
	$aMsg = [];
	$letter = mb_strtoupper($_POST['LETTER'] ?? '');
	$arFields = [
		'NAME' => $_POST['NAME'] ?? '',
		'DESCRIPTION' => $_POST['DESCRIPTION'] ?? '',
		'LETTER' => $letter,
		'BINDING' => $_POST['BINDING'] ?? '',
		'MODULE_ID' => $_POST['MODULE_ID'] ?? '',
	];

	if ($ID > 0 && $COPY_ID <= 0)
	{
		CTask::UpdateModuleRights($ID, $_POST['MODULE_ID'] ?? '', $letter);
		CTask::Update($arFields, $ID);
	}
	else
	{
		$ID = CTask::Add($arFields);
	}

	/** @var CAdminException $e */
	if ($e = $APPLICATION->GetException())
	{
		$aMsg = $e->messages;
	}

	if (empty($aMsg))
	{
		$arOperationIds = $_POST['OPERATION_ID'] ?? [];
		$oldArOperationIds = CTask::GetOperations($ID);
		if (!empty(array_diff($oldArOperationIds, $arOperationIds)) || !empty(array_diff($arOperationIds, $oldArOperationIds)))
		{
			CTask::SetOperations($ID, $arOperationIds);
		}

		if (!empty($_POST['save']))
		{
			LocalRedirect('task_admin.php?lang=' . LANGUAGE_ID);
		}
		elseif (!empty($_POST['apply']))
		{
			LocalRedirect($APPLICATION->GetCurPage() . '?lang=' . LANGUAGE_ID . '&ID=' . $ID . '&' . $tabControl->ActiveTabParam());
		}
	}
	else
	{
		$message = new CAdminMessage(GetMessage('TASK_SAVE_ERROR'), new CAdminException($aMsg));
		$bVarsFromForm = true;
	}
}

$taskData = [
	'NAME' => '',
	'DESCRIPTION' => '',
	'LETTER' => '',
	'SYS' => 'N',
	'BINDING' => 'module',
	'MODULE_ID' => 'main',
];

if ($ID > 0)
{
	$task = CTask::GetByID($ID)->Fetch();
	if ($task)
	{
		foreach ($taskData as $key => $value)
		{
			$taskData[$key] = $task[$key] ?? $value;
		}

		if ($COPY_ID > 0)
		{
			$taskData['SYS'] = 'N';
		}
	}
	else
	{
		$ID = 0;
	}
}

if ($bVarsFromForm)
{
	foreach ($taskData as $key => $value)
	{
		if (isset($_POST[$key]))
		{
			$taskData[$key] = $_POST[$key];
		}
	}
}

$sDocTitle = ($ID > 0 && $COPY_ID <= 0
	? GetMessage('EDIT_TASK_TITLE', ['#ID#' => $ID])
	: GetMessage('NEW_TASK_TITLE')
);
$APPLICATION->SetTitle($sDocTitle);

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('RECORD_LIST'),
		'TITLE' => GetMessage('RECORD_LIST_TITLE'),
		'LINK' => '/bitrix/admin/task_admin.php?lang=' . LANGUAGE_ID . '&amp;set_default=Y',
		'ICON' => 'btn_list',
	],
];

if ($ID > 0 && $COPY_ID <= 0)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];
	$aMenu[] = [
		'TEXT' => GetMessage('MAIN_NEW_RECORD'),
		'TITLE' => GetMessage('MAIN_NEW_RECORD_TITLE'),
		'LINK' => '/bitrix/admin/task_edit.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_new',
	];
	$aMenu[] = [
		'TEXT' => GetMessage('MAIN_COPY_RECORD'),
		'TITLE' => GetMessage('MAIN_COPY_RECORD_TITLE'),
		'LINK' => '/bitrix/admin/task_edit.php?lang=' . LANGUAGE_ID . '&amp;COPY_ID=' . $ID,
		'ICON' => 'btn_copy',
	];

	if ($USER->CanDoOperation('edit_tasks') && $taskData['SYS'] != 'Y')
	{
		$aMenu[] = [
			'TEXT' => GetMessage('MAIN_DELETE_RECORD'),
			'TITLE' => GetMessage('MAIN_DELETE_RECORD_TITLE'),
			'LINK' => "javascript:if(confirm('" . GetMessage('MAIN_DELETE_RECORD_CONF') . "')) window.location='/bitrix/admin/task_admin.php?ID=" . $ID . '&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "&action_button=delete';",
			'ICON' => 'btn_delete',
		];
	}
}

$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($message)
{
	echo $message->Show();
}
?>
<form method="POST" action="<?= $APPLICATION->GetCurPage() ?>?" name="form1">
<?= bitrix_sessid_post() ?>
<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
<input type="hidden" name="ID" value="<?= $ID ?>">
<?php if ($COPY_ID > 0): ?><input type="hidden" name="COPY_ID" value="<?= htmlspecialcharsbx($COPY_ID) ?>"><?php endif ?>
<?php
$tabControl->Begin();
$tabControl->BeginNextTab();

$dbOperations = COperation::GetList();

$arOperations = [];
$arBindings = [];
?>
<script>
var arOperations = [];
var arBingings = {};
<?php
while ($arOperation = $dbOperations->Fetch())
{
	$mid = $arOperation['MODULE_ID'];
	if (!isset($arBindings[$mid]))
	{
		$arBindings[$mid] = [];
		?>arBingings['<?= CUtil::JSEscape($mid) ?>'] = {};<?php
	}

	if (!in_array($arOperation['BINDING'], $arBindings[$mid], true))
	{
		$b = $arOperation['BINDING'];
		$arBindings[$mid][] = $b;
		$bindingTitle = CTask::GetLangTitle($b, $mid);
		if ($bindingTitle == $b)
		{
			$bindingTitle = CTask::GetLangTitle($bindingTitle);
		}
		?>arBingings['<?= CUtil::JSEscape($mid) ?>']['<?= CUtil::JSEscape($b) ?>'] = '<?= CUtil::JSEscape($bindingTitle) ?>';<?php
	}

	$arOperations[] = [
		'ID' => $arOperation['ID'],
		'NAME' => $arOperation['NAME'],
		'TITLE' => COperation::GetLangTitle($arOperation['NAME'], $arOperation['MODULE_ID']),
		'BINDING' => $arOperation['BINDING'],
		'MODULE_ID' => $arOperation['MODULE_ID'],
		'DESCRIPTION' => COperation::GetLangDescription($arOperation['NAME'], $arOperation['DESCRIPTION'], $arOperation['MODULE_ID']),
	];
}
Collection::sortByColumn($arOperations, 'TITLE');
?>
</script>

	<tr class="adm-detail-required-field">
		<td width="40%"><?= GetMessage('NAME') ?></td>
		<td width="60%"><input type="text" name="NAME" size="40" maxlength="100" value="<?= htmlspecialcharsbx(CTask::GetLangTitle($taskData['NAME'], $taskData['MODULE_ID'])) ?>"></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?= GetMessage('MODULE_ID') ?></td>
		<td>
		<script>
		var arModules = ['main'];
		</script>
		<select name="MODULE_ID" id="__module_id_select">
			<option value="main"<?= ($taskData['MODULE_ID'] == 'main' ? ' selected' : '') ?>><?= GetMessage('KERNEL') ?></option>
		<?php
		$modules = COperation::GetAllowedModules();
		foreach ($modules as $MID):
			if ($MID == 'main')
			{
				continue;
			}

			if (!($m = CModule::CreateModuleObject($MID)))
			{
				continue;
			}
		?>
			<script>arModules.push('<?= CUtil::JSEscape($MID) ?>');</script>
			<option value="<?= htmlspecialcharsbx($MID) ?>"<?= ($taskData['MODULE_ID'] == $MID ? ' selected' : '') ?>><?= htmlspecialcharsbx($m->MODULE_NAME) ?></option>
		<?php endforeach ?>
		</select>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('SYS_TITLE') ?>:</td>
		<td><?= ($taskData['SYS'] == 'Y' ? GetMessage('MAIN_YES') : GetMessage('MAIN_NO')) ?></td>
	</tr>
	<tr>
		<td><?= GetMessage('TASK_BINDING') ?>:</td>
		<td>
		<?php
		if (empty($arBindings[$taskData['MODULE_ID']]))
		{
			$arBindings[$taskData['MODULE_ID']] = ['module'];
		}
		?>
		<select name="BINDING" id="__binding_select">
			<?php
			foreach ($arBindings[$taskData['MODULE_ID']] as $binding)
			{
				$bindingTitle = CTask::GetLangTitle($binding, $taskData['MODULE_ID']);
				if ($bindingTitle == $binding)
				{
					$bindingTitle = CTask::GetLangTitle($bindingTitle);
				}

				echo '<option value="' . htmlspecialcharsbx($binding) . '"' . ($binding == $taskData['BINDING'] ? ' selected' : '') . '>' . htmlspecialcharsbx($bindingTitle) . '</option>';
			}
			?>
		</select>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage('LETTER') ?>:</td>
		<td><input type="text" name="LETTER" size="1" maxlength="1" value="<?= htmlspecialcharsbx($taskData['LETTER']) ?>"></td>
	</tr>
	<tr>
		<td class="adm-detail-valign-top"><?= GetMessage('DESCRIPTION') ?></td>
		<td><textarea name="DESCRIPTION" cols="30" rows="5"><?= htmlspecialcharsbx(CTask::GetLangDescription($taskData['NAME'], $taskData['DESCRIPTION'], $taskData['MODULE_ID'])) ?></textarea></td>
	</tr>
	<?php $tabControl->BeginNextTab(); ?>
	<tr>
		<td colspan="2" align="center">
		<table border="0" cellpadding="5" cellspacing="0" align="center">
			<tr>
				<td width="10%" align="center">&nbsp;</td>
				<td width="90%">&nbsp;</td>
			</tr>
			<?php
			$arTaskOperations = $_POST['OPERATION_ID'] ?? CTask::GetOperations($ID);

			$ind = -1;
			foreach ($arOperations as $arOperation)
			{
				$ind++;
				?>
				<tr id="operation_row_<?= $ind ?>"
					<?= (($arOperation['MODULE_ID'] != $taskData['MODULE_ID']) || ($arOperation['BINDING'] != $taskData['BINDING'])) ? 'style="display: none"' : '' ?>>
					<td align="right" style="padding: 0 10px 0 10px">
						<input type="checkbox" name="OPERATION_ID[]" id="OPERATION_ID_<?= $ind ?>" value="<?= htmlspecialcharsbx($arOperation['ID']) ?>"<?= (in_array($arOperation['ID'], $arTaskOperations) ? ' checked' : '') ?>>
						<script>
						arOperations[<?= $ind ?>] = {
							name: '<?= CUtil::JSEscape($arOperation['TITLE']) ?>',
							module_id: '<?= CUtil::JSEscape($arOperation['MODULE_ID']) ?>',
							binding: '<?= CUtil::JSEscape($arOperation['BINDING']) ?>'
						}
						</script>
					</td>
					<td align="left">
						<label for="OPERATION_ID_<?= $ind ?>" title="<?= htmlspecialcharsbx($arOperation['DESCRIPTION']) ?>">
							<?= htmlspecialcharsbx($arOperation['TITLE']) ?>
							<?php if ($arOperation['TITLE'] != $arOperation['NAME']): ?>
							(<?= htmlspecialcharsbx($arOperation['NAME']) ?>)
							<?php endif ?>
						</label>
					</td>
				</tr>
				<?php
			}
			?>
			<tr>
				<td align="center" colspan="2"><div id="__noneopermess" style="display: none;"></div></td>
			</tr>
		</table>
		<script>
		var __module_id_select = document.getElementById('__module_id_select');
		var __binding_select = document.getElementById('__binding_select');
		var _noneopermess = document.getElementById('__noneopermess');
		var noOperMess = "<?= GetMessageJS('TASK_NONE_OPERATIONS') ?>";

		__module_id_select.onchange = function(e)
		{
			var arB = arBingings[this.value];
			if (arB)
			{
				__binding_select.options.length = 0;
				for (var k in arB)
				{
					__binding_select.options[__binding_select.options.length] = new Option(arB[k], k);
				}
			}

			var binding = __binding_select.value;
			var operation_count = arOperations.length;
			var bShowNoneOperMess = true;
			var ch;
			for (var i = 0; i < operation_count; i++)
			{
				ch = document.getElementById('OPERATION_ID_' + i);
				if (arOperations[i].module_id == this.value && arOperations[i].binding == binding)
				{
					document.getElementById('operation_row_' + i).style.display = (jsUtils.IsIE() ? 'block' : 'table-row');
					if (arOperations[i].was_checked)
					{
						ch.checked = true;
					}
					if (bShowNoneOperMess)
					{
						bShowNoneOperMess = false;
					}
				}
				else
				{
					document.getElementById('operation_row_' + i).style.display = 'none';
					if (ch.checked)
					{
						ch.checked = false;
						arOperations[i].was_checked = true;
					}
				}
			}
			showNoneOperMess(bShowNoneOperMess);
		};

		__binding_select.onchange = function(e)
		{
			var operation_count = arOperations.length;
			var bShowNoneOperMess = true;
			var ch;
			for (var i = 0; i < operation_count; i++)
			{
				ch = document.getElementById('OPERATION_ID_' + i);
				var module_id = __module_id_select.value;
				if (arOperations[i].binding == this.value && arOperations[i].module_id == module_id)
				{
					document.getElementById('operation_row_' + i).style.display = (jsUtils.IsIE() ? 'block' : 'table-row');
					if (arOperations[i].was_checked)
					{
						ch.checked = true;
					}
					if (bShowNoneOperMess)
					{
						bShowNoneOperMess = false;
					}
				}
				else
				{
					document.getElementById('operation_row_' + i).style.display = 'none';
					if (ch.checked)
					{
						ch.checked = false;
						arOperations[i].was_checked = true;
					}
				}
			}
			showNoneOperMess(bShowNoneOperMess);
		};

		var showNoneOperMess = function(bShow)
		{
			if (bShow)
			{
				var m_title;
				var bind_title;
				var m_id = __module_id_select.value;
				var l = __module_id_select.options.length;
				for (var i = 0; i < l; i++)
				{
					if (m_id == __module_id_select.options[i].value)
					{
						m_title = __module_id_select.options[i].innerHTML;
					}
				}
				var b_id = __binding_select.value;
				l = __binding_select.options.length;
				for (i = 0; i < l; i++)
				{
					if (b_id == __binding_select.options[i].value)
					{
						bind_title = __binding_select.options[i].innerHTML;
					}
				}
				var _t = noOperMess.replace(/#MODULE_ID#/, m_title);
				_noneopermess.innerHTML = _t.replace(/#BINDING#/, bind_title);
				_noneopermess.style.display = 'block';
			}
			else
			{
				_noneopermess.style.display = 'none';
			}
		};
		</script>
		</td>
	</tr>
<?php
$tabControl->Buttons([
	'disabled' => (!$USER->CanDoOperation('edit_tasks') || $taskData['SYS'] == 'Y'),
	'back_url' => 'task_admin.php?lang=' . LANGUAGE_ID,
]);
$tabControl->End();
?>
</form>

<?php
$tabControl->ShowWarnings('form1', $message);

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
