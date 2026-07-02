<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * Bitrix vars
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 */

use Bitrix\Main\Mail\Internal\EventMessageAttachmentTable;
use Bitrix\Main\Mail\Internal\EventTypeTable;
use Bitrix\Main\Text\HtmlFilter;
use Bitrix\Main\Localization\LanguageTable;

require_once(__DIR__ . '/../include/prolog_admin_before.php');
define('HELP_FILE', 'settings/mail_events/message_edit.php');

if (!$USER->CanDoOperation('edit_other_settings') && !$USER->CanDoOperation('view_other_settings'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

CModule::IncludeModule('fileman');

$isAdmin = $USER->CanDoOperation('lpa_template_edit');
$isUserHasPhpAccess = $USER->CanDoOperation('edit_php');

IncludeModuleLangFile(__FILE__);

$strError = '';
$bVarsFromForm = false;
$ID = (int)($_REQUEST['ID'] ?? 0);
$COPY_ID = (int)($_REQUEST['COPY_ID'] ?? 0);
$requestType = (string)($_REQUEST['type'] ?? '');

$message = null;
if ($COPY_ID > 0)
{
	$ID = $COPY_ID;
}
$aTabs = [
	['DIV' => 'edit1', 'TAB' => GetMessage('MAIN_TAB'), 'ICON' => 'message_edit', 'TITLE' => GetMessage('MAIN_TAB_TITLE')],
	['DIV' => 'edit2', 'TAB' => GetMessage('ATTACHMENT_TAB'), 'ICON' => 'message_edit', 'TITLE' => GetMessage('ATTACHMENT_TAB_TITLE')],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && (!empty($_POST['save']) || !empty($_POST['apply'])) && $isAdmin && check_bitrix_sessid())
{
	$messageBody = (string)($_POST['MESSAGE'] ?? '');
	if (!$isUserHasPhpAccess)
	{
		$messageBodyOld = false;
		if ($ID > 0)
		{
			$emOldDb = CEventMessage::GetByID($ID);
			if ($emOld = $emOldDb->Fetch())
			{
				$messageBodyOld = $emOld['MESSAGE'];
			}
		}

		$messageBody = LPA::Process($messageBody, $messageBodyOld);
	}

	$additionalField = [];
	if (isset($_POST['ADDITIONAL_FIELD']) && is_array($_POST['ADDITIONAL_FIELD']))
	{
		foreach ($_POST['ADDITIONAL_FIELD'] as $addField)
		{
			if (!empty($addField['NAME']))
			{
				$additionalField[] = [
					'NAME' => $addField['NAME'],
					'VALUE' => $addField['VALUE'] ?? '',
				];
			}
		}
	}

	$em = new CEventMessage();
	$arFields = [
		'ACTIVE' => $_POST['ACTIVE'] ?? '',
		'TIMESTAMP_X' => new \Bitrix\Main\Type\DateTime(),
		'EVENT_NAME' => $_POST['EVENT_NAME'] ?? '',
		'LID' => $_POST['LID'] ?? '',
		'EMAIL_FROM' => $_POST['EMAIL_FROM'] ?? '',
		'EMAIL_TO' => $_POST['EMAIL_TO'] ?? '',
		'BCC' => $_POST['BCC'] ?? '',
		'CC' => $_POST['CC'] ?? '',
		'REPLY_TO' => $_POST['REPLY_TO'] ?? '',
		'IN_REPLY_TO' => $_POST['IN_REPLY_TO'] ?? '',
		'PRIORITY' => $_POST['PRIORITY'] ?? '',
		'FIELD1_NAME' => $_POST['FIELD1_NAME'] ?? '',
		'FIELD1_VALUE' => $_POST['FIELD1_VALUE'] ?? '',
		'FIELD2_NAME' => $_POST['FIELD2_NAME'] ?? '',
		'FIELD2_VALUE' => $_POST['FIELD2_VALUE'] ?? '',
		'SUBJECT' => $_POST['SUBJECT'] ?? '',
		'MESSAGE' => $messageBody,
		'BODY_TYPE' => $_POST['BODY_TYPE'] ?? '',
		'SITE_TEMPLATE_ID' => $_POST['SITE_TEMPLATE_ID'] ?? '',
		'ADDITIONAL_FIELD' => $additionalField,
		'LANGUAGE_ID' => $_POST['LANGUAGE_ID'] ?? '',
	];

	if ($ID > 0 && $COPY_ID <= 0)
	{
		$res = $em->Update($ID, $arFields);
	}
	else
	{
		$ID = $em->Add($arFields);
		$res = ($ID > 0);
	}

	if (!$res)
	{
		$bVarsFromForm = true;
	}
	else
	{
		$filesDelete = $_POST['FILES_del'] ?? [];
		$fileIdsToDelete = [];
		$arFiles = [];

		if (isset($_FILES['FILES']) && is_array($_FILES['FILES']))
		{
			foreach ($_FILES['FILES'] as $attribute => $files)
			{
				if (is_array($files))
				{
					foreach ($files as $index => $value)
					{
						$arFiles[$index][$attribute] = $value;
					}
				}
			}

			foreach ($arFiles as $index => $file)
			{
				if (!is_uploaded_file($file['tmp_name']))
				{
					unset($arFiles[$index]);
				}
				elseif ($index > 0)
				{
					$fileIdsToDelete[] = (int)$index;
				}
			}
		}

		if (!empty($filesDelete) && is_array($filesDelete))
		{
			foreach ($filesDelete as $file => $fileMarkDel)
			{
				$file = (int)$file;
				if ($file > 0)
				{
					$fileIdsToDelete[] = $file;
				}
			}
		}

		if (!empty($fileIdsToDelete))
		{
			$deleteFileDb = EventMessageAttachmentTable::getList([
				'select' => ['EVENT_MESSAGE_ID', 'FILE_ID'],
				'filter' => ['=EVENT_MESSAGE_ID' => $ID, '=FILE_ID' => $fileIdsToDelete],
			]);
			while ($deleteFile = $deleteFileDb->fetch())
			{
				CFile::Delete($deleteFile['FILE_ID']);
				EventMessageAttachmentTable::delete($deleteFile);
			}
		}

		if (isset($_FILES['NEW_FILE']) && is_array($_FILES['NEW_FILE']))
		{
			foreach ($_FILES['NEW_FILE'] as $attribute => $files)
			{
				if (is_array($files))
				{
					foreach ($files as $index => $value)
					{
						$arFiles[$index][$attribute] = $value;
					}
				}
			}

			foreach ($arFiles as $index => $file)
			{
				if (!is_uploaded_file($file['tmp_name']))
				{
					unset($arFiles[$index]);
				}
			}
		}

		if (array_key_exists('NEW_FILE', $_POST) && is_array($_POST['NEW_FILE']))
		{
			foreach ($_POST['NEW_FILE'] as $index => $value)
			{
				if ($USER->CanAccessFile($value))
				{
					$fileArray = CFile::MakeFileArray($_SERVER['DOCUMENT_ROOT'] . Rel2Abs('/', $value));
					if (!empty($fileArray))
					{
						$arFiles[$index] = $fileArray;
					}
				}
			}
		}

		if (array_key_exists('FILES', $_POST) && is_array($_POST['FILES']))
		{
			if ($COPY_ID > 0)
			{
				$arFileCopyTmp = [];
				foreach (array_reverse($_POST['FILES'], true) as $key => $fileId)
				{
					if (is_array($filesDelete) && array_key_exists($key, $filesDelete))
					{
						continue;
					}
					if ((int)$fileId > 0)
					{
						$arFileCopyTmp[] = $fileId;
					}
				}

				$deleteFileDb = EventMessageAttachmentTable::getList([
					'select' => ['FILE_ID'],
					'filter' => ['=EVENT_MESSAGE_ID' => $COPY_ID, '=FILE_ID' => $arFileCopyTmp],
				]);
				while ($arExistingFile = $deleteFileDb->fetch())
				{
					array_unshift($arFiles, CFile::MakeFileArray($arExistingFile['FILE_ID']));
				}
			}
			else
			{
				foreach (array_reverse($_POST['FILES'], true) as $file)
				{
					if (
						is_array($file)
						&& $file['tmp_name'] != ''
						&& $APPLICATION->GetFileAccessPermission($file['tmp_name']) >= 'W'
					)
					{
						array_unshift($arFiles, $file);
					}
				}
			}
		}

		foreach ($arFiles as $file)
		{
			if (!empty($file['name']) && isset($file['size']) && (int)$file['size'] > 0)
			{
				$resultInsertAttachFile = false;
				$file['MODULE_ID'] = 'main';
				$fid = (int)CFile::SaveFile($file, 'main', true);
				if ($fid > 0)
				{
					$resultAddAttachFile = EventMessageAttachmentTable::add([
						'EVENT_MESSAGE_ID' => $ID,
						'FILE_ID' => $fid,
					]);
					$resultInsertAttachFile = $resultAddAttachFile->isSuccess();
				}

				if (!$resultInsertAttachFile)
				{
					break;
				}
			}
		}

		if (!empty($_POST['save']))
		{
			if ($requestType != '')
			{
				LocalRedirect(BX_ROOT . '/admin/type_edit.php?EVENT_NAME=' . urlencode((string)($_REQUEST['EVENT_NAME'] ?? '')) . '&lang=' . LANGUAGE_ID);
			}
			else
			{
				LocalRedirect(BX_ROOT . '/admin/message_admin.php?lang=' . LANGUAGE_ID);
			}
		}
		else
		{
			LocalRedirect(BX_ROOT . '/admin/message_edit.php?lang=' . LANGUAGE_ID . '&ID=' . $ID . '&type=' . urlencode($requestType) . '&' . $tabControl->ActiveTabParam());
		}
	}
}

$arEventMessageFile = [];
$eventMessageData = [
	'ACTIVE' => 'Y',
	'EVENT_NAME' => $_REQUEST['EVENT_NAME'] ?? '',
	'TIMESTAMP_X' => '',
	'LID' => [],
	'LANGUAGE_ID' => '',
	'EMAIL_FROM' => '',
	'EMAIL_TO' => '',
	'BCC' => '',
	'PRIORITY' => '',
	'ADDITIONAL_FIELD' => [],
	'CC' => '',
	'REPLY_TO' => '',
	'IN_REPLY_TO' => '',
	'SUBJECT' => '',
	'MESSAGE' => '',
	'BODY_TYPE' => '',
	'SITE_TEMPLATE_ID' => '',
];

$checkboxes = [
	'ACTIVE' => 1,
];

if ($ID > 0)
{
	$em = CEventMessage::GetByID($ID);
	if ($eventMessage = $em->Fetch())
	{
		foreach ($eventMessageData as $key => $value)
		{
			$eventMessageData[$key] = $eventMessage[$key] ?? $value;
		}

		$eventMessageData['LID'] = [];
		$dbLID = CEventMessage::GetLang($ID);
		while ($arLID = $dbLID->Fetch())
		{
			$eventMessageData['LID'][] = $arLID['LID'];
		}

		$attachmentFileDb = EventMessageAttachmentTable::getList([
			'select' => ['FILE_ID'],
			'filter' => ['=EVENT_MESSAGE_ID' => $ID],
		]);
		while ($ar = $attachmentFileDb->fetch())
		{
			if ($arFileFetch = CFile::GetFileArray($ar['FILE_ID']))
			{
				$arEventMessageFile[] = $arFileFetch;
			}
		}
	}
	else
	{
		$ID = 0;
	}
}

if ($bVarsFromForm)
{
	foreach ($eventMessageData as $key => $value)
	{
		if (isset($_POST[$key]) || isset($checkboxes[$key]))
		{
			$eventMessageData[$key] = $_POST[$key] ?? '';
		}
	}

	foreach ($eventMessageData['ADDITIONAL_FIELD'] as $i => $field)
	{
		if (empty($field['NAME']))
		{
			unset($eventMessageData['ADDITIONAL_FIELD'][$i]);
		}
	}
}

$arMailSiteTemplate = [];
$mailSiteTemplateDb = CSiteTemplate::GetList(null, ['TYPE' => 'mail']);
while ($mailSiteTemplate = $mailSiteTemplateDb->GetNext())
{
	$arMailSiteTemplate[] = $mailSiteTemplate;
}

$messageValue = $eventMessageData['MESSAGE'];
if (!$isUserHasPhpAccess)
{
	$messageValue = LPA::PrepareContent($messageValue);
}

$showExt = (
	$eventMessageData['CC'] != ''
	|| $eventMessageData['BCC'] != ''
	|| $eventMessageData['REPLY_TO'] != ''
	|| $eventMessageData['IN_REPLY_TO'] != ''
	|| $eventMessageData['PRIORITY'] != ''
	|| !empty($eventMessageData['ADDITIONAL_FIELD'])
);
$showExtStyle = $showExt ? '' : 'style="display:none;"';

$additionalFields = array_merge($eventMessageData['ADDITIONAL_FIELD'], [
	['NAME' => '', 'VALUE' => ''],
	['NAME' => '', 'VALUE' => ''],
]);

if ($ID > 0 && $COPY_ID <= 0)
{
	$APPLICATION->SetTitle(GetMessage('EDIT_MESSAGE_TITLE', ['#ID#' => (string)$ID]));
}
else
{
	$APPLICATION->SetTitle(GetMessage('NEW_MESSAGE_TITLE'));
}

require($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php');
?>
<form method="POST" action="<?= $APPLICATION->GetCurPage()?>" name="form1" enctype="multipart/form-data">
<?=bitrix_sessid_post()?>
<input type="hidden" name="lang" value="<?= LANGUAGE_ID?>" />
<input type="hidden" name="ID" value="<?= $ID?>" />
<input type="hidden" name="COPY_ID" value="<?= $COPY_ID?>" />
<input type="hidden" name="type" value="<?= htmlspecialcharsbx($requestType)?>" />
<script>
var t=null;
function PutString(str, field)
{
	var bMessageHtmlEditorVisible = false;
	var messageHtmlEditor = window.BXHtmlEditor.Get('MESSAGE');
	if(messageHtmlEditor) bMessageHtmlEditorVisible = messageHtmlEditor.IsShown();


	if(!t && !bMessageHtmlEditorVisible) return;

	if(bMessageHtmlEditorVisible)
	{
		messageHtmlEditor.InsertHtml(str);
	}
	else if(t.name=="MESSAGE" || t.name=="EMAIL_FROM" || t.name=="EMAIL_TO" || t.name=="SUBJECT" || t.name=="BCC")
	{
		t.value+=str;
		BX.fireEvent(t, 'change');
	}
}


function PutAttachString(str)
{
	var bMessageHtmlEditorVisible = false;
	var messageHtmlEditor = window.BXHtmlEditor.Get('MESSAGE');
	if(messageHtmlEditor) bMessageHtmlEditorVisible = messageHtmlEditor.IsShown();


	if(!t && !bMessageHtmlEditorVisible) return;

	if(bMessageHtmlEditorVisible)
	{
		messageHtmlEditor.InsertHtml(str);
	}
	else if(t.name=="MESSAGE")
	{
		t.value+=str;
		BX.fireEvent(t, 'change');
	}
}
</script>
<?php
$aMenu = array(
	array(
		"TEXT"	=> GetMessage("RECORD_LIST"),
		"LINK"	=> "/bitrix/admin/message_admin.php?lang=".LANGUAGE_ID."&set_default=Y",
		"TITLE"	=> GetMessage("RECORD_LIST_TITLE"),
		"ICON"	=> "btn_list"
	)
);

if (intval($ID)>0 && $COPY_ID<=0)
{
	$aMenu[] = array("SEPARATOR"=>"Y");

	$aMenu[] = array(
		"TEXT"	=> GetMessage("MAIN_NEW_RECORD"),
		"LINK"	=> "/bitrix/admin/message_edit.php?lang=".LANGUAGE_ID,
		"TITLE"	=> GetMessage("MAIN_NEW_RECORD_TITLE"),
		"ICON"	=> "btn_new"
		);

	$aMenu[] = array(
		"TEXT"	=> GetMessage("MAIN_COPY_RECORD"),
		"LINK"	=> "/bitrix/admin/message_edit.php?lang=".LANGUAGE_ID.htmlspecialcharsbx("&COPY_ID=").$ID,
		"TITLE"	=> GetMessage("MAIN_COPY_RECORD_TITLE"),
		"ICON"	=> "btn_copy"
		);

	$aMenu[] = array(
		"TEXT"	=> GetMessage("MAIN_DELETE_RECORD"),
		"LINK"	=> "javascript:if(confirm('".GetMessage("MAIN_DELETE_RECORD_CONF")."')) window.location='/bitrix/admin/message_admin.php?ID=".$ID."&lang=".LANGUAGE_ID."&".bitrix_sessid_get()."&action=delete';",
		"TITLE"	=> GetMessage("MAIN_DELETE_RECORD_TITLE"),
		"ICON"	=> "btn_delete"
		);
}
$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($e = $APPLICATION->GetException())
	$message = new CAdminMessage(GetMessage("MAIN_ERROR_SAVING"), $e);
if($message)
	echo $message->Show();

if($strError != '')
	CAdminMessage::ShowMessage(["MESSAGE" => $strError, "HTML" => true, "TYPE" => "ERROR"]);

$tabControl->Begin();

$tabControl->BeginNextTab();
?>
	<tr>
		<td><?= GetMessage("EVENT_NAME")?></td>
		<td><?php
			$event_type_ref = array();
			$rsType = CEventType::GetList(
				array(
					"LID"=>LANGUAGE_ID,
					"EVENT_TYPE" => EventTypeTable::TYPE_EMAIL),
				array("name"=>"asc")
			);
			while ($arType = $rsType->Fetch())
			{
				$arType["NAME_WITHOUT_EVENT_NAME"] = $arType["NAME"];
				$arType["NAME"] = $arType["NAME"]." [".$arType["EVENT_NAME"]."]";
				$event_type_ref[$arType["EVENT_NAME"]] = $arType;
			}

			if($ID>0 && $COPY_ID<=0)
			{
				$arType = $event_type_ref[$eventMessageData['EVENT_NAME']] ?? ['DESCRIPTION' => '', 'NAME_WITHOUT_EVENT_NAME' => ''];
				$type_DESCRIPTION = htmlspecialcharsbx($arType["DESCRIPTION"]);
				$type_NAME = htmlspecialcharsbx($arType["NAME_WITHOUT_EVENT_NAME"]);
				?><input type="hidden" name="EVENT_NAME" value="<?= htmlspecialcharsbx($eventMessageData['EVENT_NAME']) ?>">[<a href="type_edit.php?EVENT_NAME=<?= urlencode($eventMessageData['EVENT_NAME']) ?>&amp;lang=<?= LANGUAGE_ID?>"><?= htmlspecialcharsbx($eventMessageData['EVENT_NAME']) ?></a>] <?= $type_NAME?> <?php
			}
			else
			{
				$id_1st = false;
				?>
				<select name="EVENT_NAME" style="width:370px" onchange="window.location='message_edit.php?lang=<?=LANGUAGE_ID?>&EVENT_NAME='+this[this.selectedIndex].value">
				<?php
				foreach($event_type_ref as $ev_name=>$arType):
					if($id_1st===false)
						$id_1st = $ev_name;
				?>
					<option value="<?=htmlspecialcharsbx($arType["EVENT_NAME"])?>"<?php
					if($eventMessageData['EVENT_NAME'] == $arType["EVENT_NAME"])
					{
						echo " selected";
						$id_1st = $ev_name;
										}
					?>><?=htmlspecialcharsbx($arType["NAME"])?></option>
				<?php
				endforeach;
				?>
				</select>
				<?php
					$type_DESCRIPTION = $id_1st !== false ? htmlspecialcharsbx($event_type_ref[$id_1st]["DESCRIPTION"]) : '';
				}
			?></td>
		</tr>
		<?php if($ID>0 && $COPY_ID<=0):?>
		<tr>
			<td width="40%"><?= GetMessage('LAST_UPDATE')?></td>
			<td width="60%"><?= htmlspecialcharsbx($eventMessageData['TIMESTAMP_X']) ?></td>
		</tr>
		<?php endif; ?>
		<tr>
			<td><label for="active"><?= GetMessage('ACTIVE')?></label></td>
			<td><input type="checkbox" name="ACTIVE" id="active" value="Y"<?php if($eventMessageData['ACTIVE'] == 'Y') echo " checked"?>></td>
		</tr>
		<tr class="adm-detail-required-field">
			<td class="adm-detail-valign-top"><?= GetMessage('LID')?></td>
			<td><?=CLang::SelectBoxMulti("LID", $eventMessageData['LID']);?></td>
		</tr>
	<tr>
		<td><?= GetMessage("main_mess_edit_lang")?></td>
		<td>
			<select name="LANGUAGE_ID">
				<option value=""><?= GetMessage("main_mess_edit_lang_not_set")?></option>
				<?php
				$languages = LanguageTable::getList(array(
					"filter" => array("=ACTIVE" => "Y"),
					"order" => array("SORT" => "ASC", "NAME" => "ASC")
				));
				?>
					<?php while($language = $languages->fetch()): ?>
						<option value="<?=$language["LID"]?>"<?php if($eventMessageData['LANGUAGE_ID'] == $language["LID"]) echo " selected" ?>>
							<?= HtmlFilter::encode($language["NAME"])?>
						</option>
					<?php endwhile ?>
			</select>
		</td>
	</tr>
	<tr class="heading">
		<td colspan="2"><?= GetMessage("main_mess_edit_fields")?></td>
	</tr>
		<tr class="adm-detail-required-field">
			<td><?= GetMessage('MSG_EMAIL_FROM')?></td>
			<td><input type="text" name="EMAIL_FROM" size="50" maxlength="255" value="<?= htmlspecialcharsbx($eventMessageData['EMAIL_FROM']) ?>" onfocus="t=this">
			</td>
		</tr>
		<tr class="adm-detail-required-field">
			<td><?= GetMessage('MSG_EMAIL_TO')?></td>
			<td><input type="text" name="EMAIL_TO" size="50" maxlength="255" value="<?= htmlspecialcharsbx($eventMessageData['EMAIL_TO']) ?>" onfocus="t=this"></td>
		</tr>

		<?php if(!$showExt): ?>
			<script>
			function ShowExtH()
			{
			for(var i=1; i<12; i++)
			{
				if(!document.getElementById('msg_ext'+i)) break;

				try
				{
					document.getElementById('msg_ext'+i).style.display = 'table-row';
				}
				catch(e)
				{
					document.getElementById('msg_ext'+i).style.display = 'block';
				}
			}
			document.getElementById('msg_ext0').style.display = 'none';
		}
		</script>
			<tr id="msg_ext0">
				<td></td>
				<td><a href="javascript:void(0)" onclick="return ShowExtH()"><?= GetMessage("MSG_EXT")?></a></td>
			</tr>
		<?php endif; ?>

		<tr id="msg_ext1" <?=$showExtStyle?>>
			<td><?= GetMessage("MSG_CC")?></td>
			<td><input type="text" name="CC" size="50" maxlength="255" value="<?= htmlspecialcharsbx($eventMessageData['CC']) ?>" onfocus="t=this">
			</td>
		</tr>

		<tr id="msg_ext2" <?=$showExtStyle?>>
			<td><?= GetMessage("MSG_BCC")?></td>
			<td><input type="text" name="BCC" size="50" value="<?= htmlspecialcharsbx($eventMessageData['BCC']) ?>" onfocus="t=this">
			</td>
		</tr>

		<tr id="msg_ext3" <?=$showExtStyle?>>
			<td><?= GetMessage("MSG_REPLY_TO")?></td>
			<td><input type="text" name="REPLY_TO" size="50" maxlength="255" value="<?= htmlspecialcharsbx($eventMessageData['REPLY_TO']) ?>" onfocus="t=this">
			</td>
		</tr>

		<tr id="msg_ext4" <?=$showExtStyle?>>
			<td><?= GetMessage("MSG_IN_REPLY_TO")?></td>
			<td><input type="text" name="IN_REPLY_TO" size="50" maxlength="255" value="<?= htmlspecialcharsbx($eventMessageData['IN_REPLY_TO']) ?>" onfocus="t=this">
			</td>
		</tr>

		<tr id="msg_ext5" <?=$showExtStyle?>>
			<td><?= GetMessage("MSG_PRIORITY")?></td>
			<td>
			<input type="text" name="PRIORITY" id="MSG_PRIORITY" size="10" maxlength="255" value="<?= htmlspecialcharsbx($eventMessageData['PRIORITY']) ?>" onfocus="t=this">
			<select onchange="document.getElementById('MSG_PRIORITY').value=this.value">
				<option value=""></option>
				<option value="1 (Highest)"<?php if($eventMessageData['PRIORITY'] == '1 (Highest)') echo ' selected'?>><?= GetMessage("MSG_PRIORITY_1")?></option>
				<option value="3 (Normal)"<?php if($eventMessageData['PRIORITY'] == '3 (Normal)') echo ' selected'?>><?= GetMessage("MSG_PRIORITY_3")?></option>
				<option value="5 (Lowest)"<?php if($eventMessageData['PRIORITY'] == '5 (Lowest)') echo ' selected'?>><?= GetMessage("MSG_PRIORITY_5")?></option>
			</select>
			</td>
		</tr>

		<?php $msg_ext = 5; ?>
		<?php foreach($additionalFields as $i => $additionalField):?>
			<tr id="msg_ext<?=++$msg_ext?>" <?=$showExtStyle?>>
				<td>
					<input type="text" name="ADDITIONAL_FIELD[<?= $i ?>][NAME]" size="20" maxlength="255" value="<?= htmlspecialcharsbx($additionalField['NAME'])?>" onfocus="t=this">:
				</td>
			<td>
				<input type="text" name="ADDITIONAL_FIELD[<?= $i ?>][VALUE]" size="55" maxlength="255" value="<?= htmlspecialcharsbx($additionalField['VALUE'])?>" onfocus="t=this">
			</td>
		</tr>
	<?php endforeach;?>


		<tr>
			<td><?= GetMessage("SUBJECT")?></td>
			<td><input type="text" name="SUBJECT" size="50" maxlength="255" value="<?= htmlspecialcharsbx($eventMessageData['SUBJECT']) ?>" onfocus="t=this"></td>
		</tr>
	<tr class="heading">
		<td colspan="2"><?=GetMessage("MSG_BODY")?></td>
	</tr>
	<tr>
		<td><?= GetMessage('MSG_SITE_TEMPLATE_ID')?></td>
		<td>
				<select name="SITE_TEMPLATE_ID">
					<option value=""></option>
					<?php foreach($arMailSiteTemplate as $mailTemplate):?>
						<option value="<?=$mailTemplate['ID']?>" <?=($mailTemplate['ID'] == $eventMessageData['SITE_TEMPLATE_ID'] ? 'selected' : '')?>>[<?=$mailTemplate['ID']?>] <?=$mailTemplate['NAME']?></option>
					<?php endforeach;?>
				</select>
			</td>
	</tr>

	<tr>
		<td colspan="2" align="center">
				<?php CFileMan::AddHTMLEditorFrame(
					"MESSAGE",
					$messageValue,
					"BODY_TYPE",
					$eventMessageData['BODY_TYPE'],
					array(
						'height' => 450,
						'width' => '100%'
				),
				"N",
				0,
				"",
				"onfocus=\"t=this\"",
					false,
					!$isUserHasPhpAccess,
					false,
					array(
						//'saveEditorKey' => $IBLOCK_ID,
						//'site_template_type' => 'mail',
						'templateID' => $eventMessageData['SITE_TEMPLATE_ID'],
						'componentFilter' => ['TYPE' => 'mail'],
						'limit_php_access' => !$isUserHasPhpAccess
					)
				);?>
			<script>
				BX.addCustomEvent('OnEditorInitedAfter', function(editor){editor.components.SetComponentIcludeMethod('EventMessageThemeCompiler::includeComponent'); });
			</script>
		</td>
	</tr>

	<?php
	$arAttachedImagePlaceHolders = array();
	foreach($arEventMessageFile as $arFile)
	{
		if(str_starts_with($arFile['CONTENT_TYPE'], 'image'))
		{
			$arAttachedImagePlaceHolders[] = $arFile;
		}
	}
	?>
	<?php if(!empty($arAttachedImagePlaceHolders)):?>
	<tr>
		<td align="left" colspan="2"><br><b><?=GetMessage("AVAILABLE_FIELDS_ATTACHMENT")?></b><br><br>
			<?php foreach($arAttachedImagePlaceHolders as $arFile):?>
				<a title="<?=GetMessage("MAIN_INSERT")?>" href="javascript:PutAttachString('<img bxmailattachcid=\'<?=$arFile["ID"]?>\' src=\'<?=$arFile['SRC']?>\' width=\'<?=$arFile['WIDTH']?>\' height=\'<?=$arFile['HEIGHT']?>\'>');"><?=htmlspecialcharsbx($arFile['ORIGINAL_NAME'])?></a><br>
			<?php endforeach;?>
		</td>
	</tr>
	<?php endif;?>
	<?php
	$str_def =
	"#DEFAULT_EMAIL_FROM# - ".GetMessage("MAIN_MESS_ED_DEF_EMAIL")."
	#SITE_NAME# - ".GetMessage("MAIN_MESS_ED_SITENAME")."
	#SERVER_NAME# - ".GetMessage("MAIN_MESS_ED_SERVERNAME")."
	";
	function ReplaceVars($str)
	{
		return preg_replace("/(#.+?#)/", "<a title='".GetMessage("MAIN_INSERT")."' href=\"javascript:PutString('\\1')\">\\1</a>", $str);
	}
	?>
	<tr>
		<td align="left" colspan="2"><br><b><?=GetMessage("AVAILABLE_FIELDS")?></b><br><br>
			<?= ReplaceVars(nl2br(trim($type_DESCRIPTION)."\r\n".$str_def));?>
			<?=BeginNote()?>
				<?= GetMessage("main_message_edit_html_note")?>
			<?=EndNote()?>
		</td>
	</tr>

	<?php
	//********************
	//Attachments
	//********************
	$tabControl->BeginNextTab();
	?>
	<tr class="heading">
		<td colspan="2"><?=GetMessage("ATTACHMENT_PRESET")?></td>
	</tr>
	<tr>
		<td class="adm-detail-valign-top"><?=GetMessage("ATTACHMENT_PRESET_LOAD")?>:</td>
		<td>
			<?php
			$arInputControlValues = array();
			foreach($arEventMessageFile as $arFile)
			{
				$arInputControlValues["FILES[".$arFile["ID"]."]"] = $arFile["ID"];
			}
			echo CFileInput::ShowMultiple($arInputControlValues, "NEW_FILE[n#IND#]",
				array(
					"IMAGE" => "Y",
					"PATH" => "Y",
					"FILE_SIZE" => "Y",
					"DIMENSIONS" => "Y",
					"IMAGE_POPUP" => "Y",
				),
				false,
				array(
					'upload' => true,
					'medialib' => true,
					'file_dialog' => true,
					'cloud' => true,
					'del' => true,
					'description' => false,
				)
			);
			?>
		</td>
	</tr>


<?php $tabControl->Buttons(array("disabled" => !$isAdmin, "back_url"=>"message_admin.php?lang=".LANGUAGE_ID));
$tabControl->End();
$tabControl->ShowWarnings("form1", $message);
?>
</form>

<?php
require($_SERVER["DOCUMENT_ROOT"] . BX_ROOT . "/modules/main/include/epilog_admin.php");
