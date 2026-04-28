<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';
/** @var CMain $APPLICATION */
/** @var CDatabase $DB */
/** @var CUser $USER */

if (!$USER->CanDoOperation('controller_counters_view') || !CModule::IncludeModule('controller'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}
require_once $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/controller/prolog.php';

IncludeModuleLangFile(__FILE__);

$message = null;
$ID = intval($_REQUEST['ID']);

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('CTRL_COUNTER_EDIT_TAB1'),
		'TITLE' => GetMessage('CTRL_COUNTER_EDIT_TAB1_TITLE'),
	],
	[
		'DIV' => 'edit2',
		'TAB' => GetMessage('CTRL_COUNTER_EDIT_CONTROLLER_GROUP'),
		'TITLE' => GetMessage('CTRL_COUNTER_EDIT_CONTROLLER_GROUP_TITLE'),
	],
	[
		'DIV' => 'edit3',
		'TAB' => GetMessage('CTRL_COUNTER_EDIT_COMMAND'),
		'TITLE' => GetMessage('CTRL_COUNTER_EDIT_COMMAND_TITLE'),
	],
];

$tabControl = new CAdminTabControl('tabControl', $aTabs);

if (
	$_SERVER['REQUEST_METHOD'] == 'POST'
	&& check_bitrix_sessid()
	&& $USER->CanDoOperation('controller_counters_manage')
	&& (
		isset($_POST['save'])
		|| isset($_POST['apply'])
		|| isset($_POST['delete'])
	)
)
{
	if (isset($_POST['delete']) && $_POST['delete'] === 'y')
	{
		CControllerCounter::Delete($ID);

		LocalRedirect($_REQUEST['back_url'] ?: 'controller_counter_admin.php?lang=' . LANGUAGE_ID);
	}
	else
	{
		$arFields = [
			'COUNTER_TYPE' => $_POST['COUNTER_TYPE'],
			'COUNTER_FORMAT' => $_POST['COUNTER_FORMAT'],
			'NAME' => $_POST['NAME'],
			'CONTROLLER_GROUP_ID' => $_POST['CONTROLLER_GROUP_ID'],
			'COMMAND_SOURCE' => $_POST['COMMAND_SOURCE'] === 'file' ? 'file' : 'text',
			'COMMAND' => false,
			'COMMAND_FILE' => false,
		];

		if (
			$arFields['COMMAND_SOURCE'] === 'file'
			&& isset($_POST['COMMAND_FILE'])
			&& ($_POST['COMMAND_FILE'] != '')
		)
		{
			$filename = trim(str_replace('\\', '/', trim($_POST['COMMAND_FILE'])), '/');
			$FILE_NAME = Rel2Abs($_SERVER['DOCUMENT_ROOT'], '/' . $filename);
			if (
				(mb_strlen($FILE_NAME) > 1)
				&& ($FILE_NAME === '/' . $filename)
				&& ($APPLICATION->GetFileAccessPermission($FILE_NAME) >= 'W')
			)
			{
				$arFields['COMMAND_FILE'] = $FILE_NAME;
			}
		}

		if ($arFields['COMMAND_SOURCE'] === 'text')
		{
			$arFields['COMMAND'] = $_POST['COMMAND'] ?? '';
		}

		$command = $arFields['COMMAND_SOURCE'] === 'file' ? file_get_contents($_SERVER['DOCUMENT_ROOT'] . $arFields['COMMAND_FILE']) : $arFields['COMMAND'];
		if (str_starts_with($command, '<' . '?'))
		{
			$command = mb_substr($command, 2);
			if (str_starts_with($command, 'php'))
			{
				$command = mb_substr($command, 3);
			}
		}

		if ($error = CControllerCounter::checkCommandSyntax($command))
		{
			$e = new CApplicationException(GetMessage('CTRL_COUNTER_EDIT_COMMAND_TITLE') . ': ' . $error);
			$APPLICATION->ThrowException($e);
			$res = false;
		}
		elseif ($ID > 0)
		{
			$res = CControllerCounter::Update($ID, $arFields);
		}
		else
		{
			$res = $ID = CControllerCounter::Add($arFields);
		}

		if (!$res)
		{
			if ($e = $APPLICATION->GetException())
			{
				$message = new CAdminMessage(GetMessage('CTRL_COUNTER_EDIT_ERROR'), $e);
			}
		}
		else
		{
			if (isset($_POST['save']))
			{
				LocalRedirect($_REQUEST['back_url'] ?: 'controller_counter_admin.php?lang=' . LANGUAGE_ID);
			}
			else
			{
				LocalRedirect('controller_counter_edit.php?lang=' . LANGUAGE_ID . '&ID=' . $ID . '&' . $tabControl->ActiveTabParam());
			}
		}
	}
}

$arCounter = CControllerCounter::GetArrayByID($ID);
if (!is_array($arCounter))
{
	$ID = 0;
}

if ($message !== null)
{
	$arCounter = [
		'COUNTER_TYPE' => $_POST['COUNTER_TYPE'],
		'COUNTER_FORMAT' => $_POST['COUNTER_FORMAT'],
		'NAME' => $_POST['NAME'],
		'COMMAND_SOURCE' => $_POST['COMMAND_SOURCE'],
		'COMMAND' => $_POST['COMMAND'],
		'COMMAND_FILE' => $_POST['COMMAND_FILE'],
		'CONTROLLER_GROUP_ID' => is_array($_POST['CONTROLLER_GROUP_ID']) ? $_POST['CONTROLLER_GROUP_ID'] : [],
	];
}
elseif ($ID <= 0)
{
	$arCounter = [
		'COUNTER_TYPE' => 'F',
		'COUNTER_FORMAT' => '',
		'NAME' => '',
		'COMMAND_SOURCE' => 'text',
		'COMMAND' => '',
		'COMMAND_FILE' => '',
		'CONTROLLER_GROUP_ID' => [],
	];
}

$sDocTitle = $ID > 0 ? GetMessage('CTRL_CNT_EDIT_TITLE', ['#ID#' => $ID]) : GetMessage('CTRL_CNT_EDIT_TITLE_NEW');
$APPLICATION->SetTitle($sDocTitle);

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';
$aMenu = [
	[
		'ICON' => 'btn_list',
		'TEXT' => GetMessage('CTRL_COUNTER_EDIT_TOOLBAR_LIST'),
		'LINK' => 'controller_counter_admin.php?lang=' . LANGUAGE_ID
	]
];

if ($ID > 0 && $USER->CanDoOperation('controller_counters_view'))
{
		$aMenu[] = [
			'TEXT' => GetMessage('CTRL_COUNTER_EDIT_TOOLBAR_HISTORY_TEXT'),
			'TITLE' => GetMessage('CTRL_COUNTER_EDIT_TOOLBAR_HISTORY'),
			'LINK' => 'controller_counter_history.php?COUNTER_ID=' . $ID . '&apply_filter=Y&lang=' . LANGUAGE_ID,
		];
}

if ($ID > 0 && $USER->CanDoOperation('controller_counters_manage'))
{
	$aMenu[] = ['SEPARATOR' => 'Y'];

	$aMenu[] = [
		'ICON' => 'btn_new',
		'TEXT' => GetMessage('CTRL_COUNTER_EDIT_TOOLBAR_NEW'),
		'LINK' => 'controller_counter_edit.php?lang=' . LANGUAGE_ID
	];

	$aMenu[] = [
		'TEXT' => GetMessage('CTRL_COUNTER_EDIT_TOOLBAR_DELETE'),
		'ICON' => 'btn_delete',
		'LINK' => "javascript:jsDelete('form1', '" . GetMessage('CTRL_COUNTER_EDIT_TOOLBAR_DELETE_CONFIRM') . "')",
	];
}

$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($message)
{
	echo $message->Show();
}

?>
<script>
	function jsDelete(form_id, message)
	{
		var _form = BX(form_id);
		var _flag = BX('delete');
		if (_form && _flag)
		{
			if (confirm(message))
			{
				_flag.value = 'y';
				_form.submit();
			}
		}
	}
</script>

<form method="POST" action="<?php echo $APPLICATION->GetCurPage() ?>?lang=<?=LANGUAGE_ID?>&amp;ID=<?=$ID?>" name="form1" id="form1">
	<?php $tabControl->Begin(); ?>
	<?php $tabControl->BeginNextTab(); ?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?php echo GetMessage('CTRL_COUNTER_EDIT_NAME') ?>:</td>
		<td width="60%">
			<input type="text" name="NAME" size="53" maxlength="255" value="<?php echo htmlspecialcharsbx($arCounter['NAME']) ?>">
		</td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?php echo GetMessage('CTRL_COUNTER_EDIT_COUNTER_TYPE') ?>:</td>
		<td><select name="COUNTER_TYPE">
				<?php foreach (CControllerCounter::GetTypeArray() as $key => $value): ?>
					<option value="<?php echo htmlspecialcharsbx($key) ?>" <?php echo ($arCounter['COUNTER_TYPE'] == $key) ? 'selected' : ''?>><?php echo htmlspecialcharsEx($value) ?></option>
				<?php endforeach; ?>
			</select>
		</td>
	</tr>
	<tr>
		<td><?php echo GetMessage('CTRL_COUNTER_EDIT_COUNTER_FORMAT') ?>:</td>
		<td><select name="COUNTER_FORMAT">
				<?php foreach (CControllerCounter::GetFormatArray() as $key => $value): ?>
					<option value="<?php echo htmlspecialcharsbx($key) ?>" <?php echo ($arCounter['COUNTER_FORMAT'] == $key) ? 'selected' : ''?>><?php echo htmlspecialcharsEx($value) ?></option>
				<?php endforeach; ?>
			</select>
		</td>
	</tr>
	<?php $tabControl->BeginNextTab(); ?>
	<tr valign="top">
		<td width="40%" class="adm-detail-valign-top">&nbsp;</td>
		<td width="60%" valign="top">
			<div class="checkboxes">
				<input type="checkbox" id="group_filter_checkbox" />
				<input type="text" value="" id="group_filter">
				<?php
				$dbr_group = CControllerGroup::GetList(['SORT' => 'ASC', 'NAME' => 'ASC', 'ID' => 'ASC']);
				while ($ar_group = $dbr_group->GetNext()):
					?>
					<div class="adm-list-item">
						<input
							type="checkbox"
							name="CONTROLLER_GROUP_ID[]"
							id="CONTROLLER_GROUP_ID_<?php echo htmlspecialcharsbx($ar_group['ID']) ?>"
							value="<?php echo htmlspecialcharsbx($ar_group['ID']) ?>"
							<?php echo (in_array($ar_group['ID'], $arCounter['CONTROLLER_GROUP_ID'])) ? 'checked' : ''?>
						/>
						<label
							for="CONTROLLER_GROUP_ID_<?php echo htmlspecialcharsbx($ar_group['ID']) ?>"
						><?php echo htmlspecialcharsEx($ar_group['NAME']) ?></label>
					</div>
				<?php endwhile; ?>
			</div>
			<script>
				function group_filter_change()
				{
					var group_filter = BX('group_filter');
					var check_boxes = document.getElementsByName('CONTROLLER_GROUP_ID[]');
					var all_checked = true;
					var all_unchecked = true;
					for (var i = 0; i < check_boxes.length; i++)
					{
						var found = false;
						var labels = check_boxes[i].labels;
						for (var j = 0; j < labels.length; j++)
						{
							if (labels[j].innerHTML.indexOf(group_filter.value) != -1)
							{
								found = true;
								break;
							}
						}
						check_boxes[i].parentNode.style.display = found? 'block': 'none';
						if (found)
						{
							all_checked = all_checked && check_boxes[i].checked;
							all_unchecked = all_unchecked && !check_boxes[i].checked;
						}
					}
				}
				function group_filter_checkbox_change()
				{
					var group_filter = BX('group_filter');
					var group_filter_checkbox = BX('group_filter_checkbox');
					var check_boxes = document.getElementsByName('CONTROLLER_GROUP_ID[]');
					for (var i = 0; i < check_boxes.length; i++)
					{
						if (check_boxes[i].parentNode.style.display != 'none')
							check_boxes[i].checked = group_filter_checkbox.checked;
					}
				}
				BX.ready(function(){
					BX.bind(BX('group_filter'), "bxchange", group_filter_change);
					BX.bind(BX('group_filter_checkbox'), "click", group_filter_checkbox_change);
				});
			</script>
		</td>
	</tr>
	<?php $tabControl->BeginNextTab(); ?>
	<tr>
		<td width="40%">
			<label for="ffilename"><?=GetMessage('CTRL_COUNTER_EDIT_COMMAND_SOURCE')?>:</label>
		</td>
		<td width="60%">
			<label><input type="radio" name="COMMAND_SOURCE" value="text" <?php echo ($arCounter['COMMAND_SOURCE'] != 'file') ? 'checked' : ''?> onclick="toggle_command_source();">&nbsp;<?php echo GetMessage('CTRL_COUNTER_EDIT_COMMAND_SOURCE_FORM')?></label><br>
			<label><input type="radio" name="COMMAND_SOURCE" value="file" <?php echo ($arCounter['COMMAND_SOURCE'] == 'file') ? 'checked' : ''?> onclick="toggle_command_source();">&nbsp;<?php echo GetMessage('CTRL_COUNTER_EDIT_COMMAND_SOURCE_FILE')?></label><br>
		</td>
	</tr>
	<tr id="COMMAND_SOURCE_FILE">
		<td width="40%">
			<label for="ffilename"><?=GetMessage('CTRL_COUNTER_EDIT_COMMAND_FILE')?>:</label>
		</td>
		<td width="60%">
			<input type="text" id="ffilename" name="COMMAND_FILE" value="<?php echo htmlspecialcharsbx($arCounter['COMMAND_FILE'])?>" size="80">
			<script>
			function setFile(filename, path, site)
			{
				if(filename == path)
				{
					document.getElementById('ffilename').value = filename;
				}
				else
				{
					if(path != '/')
						path += '/';
					document.getElementById('ffilename').value = path + filename;
				}
			}
			</script><?php
			CAdminFileDialog::ShowScript([
				'event' => 'OpenFileBrowserWindFile',
				'arResultDest' => ['FUNCTION_NAME' => 'setFile'],
				//'arPath' => ['SITE' => 'ru', 'PATH' => '/'],
				'select' => 'F',// F - file only, D - folder only, DF - files & dirs
				'operation' => 'O',// O - open, S - save
				'showUploadTab' => true,
				'showAddToMenuTab' => true,
				'fileFilter' => 'php',
				'allowAllFiles' => true,
				'SaveConfig' => true
			]);
			?><input type="button" onclick="OpenFileBrowserWindFile();" value="<?php echo GetMessage('CTRL_COUNTER_EDIT_OPEN_FILE_BUTTON')?>">
		</td>
	</tr>
	<tr id="COMMAND_SOURCE_TEXT">
		<td colspan="2">
			<textarea name="COMMAND" id="COMMAND" style="width:100%" rows="20"><?php echo htmlspecialcharsbx($arCounter['COMMAND']) ?></textarea>
		</td>
	</tr>
	<?php
	$tabControl->EndTab();
	$tabControl->Buttons([
		'back_url' => $_REQUEST['back_url'] ?: 'controller_counter_admin.php?lang=' . LANGUAGE_ID,
		'disabled' => !$USER->CanDoOperation('controller_counters_manage'),
	]);
	$tabControl->End();
	echo bitrix_sessid_post();
	?>
	<input type="hidden" name="lang" value="<?php echo LANGUAGE_ID ?>">
	<?php if ($ID > 0): ?>
		<input type="hidden" name="ID" value="<?=$ID?>">
		<input type="hidden" name="delete" id="delete" value="">
	<?php endif; ?>
	<?php if (isset($_REQUEST['back_url'])): ?>
		<input type="hidden" name="back_url" value="<?php echo htmlspecialcharsbx($_REQUEST['back_url']) ?>">
	<?php endif ?>
	<input type="hidden" value="Y" name="apply">
</form>
<script>
function toggle_command_source()
{
	const selector = 'input[name="COMMAND_SOURCE"]:checked';
	const selectedRadio = document.querySelector(selector);
	if (selectedRadio && selectedRadio.value == 'file')
	{
		BX('COMMAND_SOURCE_FILE').style.display = '';
		BX('COMMAND_SOURCE_TEXT').style.display = 'none';
	}
	else
	{
		BX('COMMAND_SOURCE_FILE').style.display = 'none';
		BX('COMMAND_SOURCE_TEXT').style.display = '';
	}
}
BX.ready(toggle_command_source);
</script>
<?php
if (COption::GetOptionString('fileman', 'use_code_editor', 'Y') == 'Y' && CModule::IncludeModule('fileman'))
{
	CCodeEditor::Show([
		'textareaId' => 'COMMAND',
		'height' => 350,
		'forceSyntax' => 'php',
	]);
}
?>
<?php require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
