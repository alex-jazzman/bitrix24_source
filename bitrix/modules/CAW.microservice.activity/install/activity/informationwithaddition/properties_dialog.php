<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);
?>

<?= $javascriptFunctions ?>
<script language="JavaScript">
var BPRIAParams = <?=(is_array($arCurrentValues["requested_information"])?CUtil::PhpToJSObject($arCurrentValues["requested_information"]):'{}')?>;
<?= require_once("properties_dialog.js"); ?>
</script>

<tbody id="ria_pd_list_form">
	<tr>
		<td align="right" width="40%">
			<span class="adm-required-field"><?=Loc::getMessage('INPUT_COORDINATING')?>:</span></td>
		<td width="60%">
			<select name="coordinating">
				<? foreach ($arCurrentValues['coordinating_items'] as $index): ?>
					<option
						value="<?= $index['ID'] ?>"<?= ($index['ID'] == $arCurrentValues['coordinating'] ? " selected=\"selected\"" : '') ?>><?= $index['COORDINATOR_NAME'] ?></option>
				<? endforeach; ?>
			</select>
		</td>
	</tr>

	<tr>
		<td align="right" width="40%">
		<span class="adm-required-field"><?= Loc::getMessage('INPUT_TASKNAME') ?>:</span></td>
		<td width="60%">
			<input type="text" name="taskname" id="id_taskname"
				value="<?= htmlspecialcharsbx($arCurrentValues['taskname']) ?>" size="50">
			<input type="button" value="..." onclick="BPAShowSelector('id_taskname', 'string');">
		</td>
	</tr>

	<tr>
		<td align="right" width="40%">
		<span class="adm-required-field"><?= Loc::getMessage('INPUT_TASKDESC') ?>:</span></td>
		<td width="60%">
		<textarea style="resize:none" name="taskdesc" id="id_taskdesc" rows="5" cols="52"><?=htmlspecialcharsbx($arCurrentValues['taskdesc'])?></textarea>
			<input type="button" value="..." onclick="BPAShowSelector('id_taskdesc', 'string');">
		</td>
	</tr>

	<tr>
		<td align="right" width="40%">
		<span class="adm-required-field"><?= Loc::getMessage('INPUT_AGREE') ?>:</span></td>
		<td width="60%">
			<input type="text" name="agree" id="id_agree"
				value="<?= htmlspecialcharsbx($arCurrentValues['agree']) ?>" size="50">
			<input type="button" value="..." onclick="BPAShowSelector('id_agree', 'string');">
		</td>
	</tr>

	<tr id="pd_list" >
		<td align="right" width="40%">
				<span class="adm-required-field"><?=Loc::getMessage('INPUT_LINKDOCUMENT')?>:</span>
		</td>
		<td width="60%">
			<table width="60%" border="0" cellpadding="2" cellspacing="2" id="bwfvc_addrow_table1">
			</table>
			<input type="button" value="<?= GetMessage("ADD_CONDITION");?>" onclick="AddCondition('', ''); return false;">
		</td>
	</tr>

	<tr>
		<td align="right" width="40%">
			<span class="adm-required-field"><?=Loc::getMessage('INPUT_SETHEADER')?>:</span></td>
		<td width="60%">
			<select name="setheader">
				<? foreach ($arCurrentValues['YesNo'] as $index): ?>
					<option
						value="<?= $index["ID"] ?>"<?= ($index["ID"] == $arCurrentValues['setheader'] ? " selected=\"selected\"" : '') ?>><?= $index["NAME"] ?></option>
				<? endforeach; ?>
			</select>
		</td>
	</tr>

	<tr>
			<td align="right" width="40%">
			<span class="adm-required-field"><?= Loc::getMessage('INPUT_TEXTHEADER') ?>:</span></td>
			<td width="60%">
				<input type="text" name="textheader" id="id_textheader"
					value="<?= htmlspecialcharsbx($arCurrentValues['textheader']) ?>" size="50">
				<input type="button" value="..." onclick="BPAShowSelector('id_textheader', 'string');">
			</td>
	</tr>
	</tbody>					
		<table width="100%" id="ria_pd_list_table" class="internal">
			<tr class="heading">
				<td><?= GetMessage("EX_DOCUMENT_NAME") ?></td>
				<td><?= GetMessage("EX_DOCUMENT_TITLE") ?></td>
				<td><?= GetMessage("EX_DOCUMENT_TYPE") ?></td>
				<td>&nbsp;</td>
			</tr>
		</table>
		<br>
		<input type="button" value="<?= GetMessage("ADD_CONDITION");?>" id="btn-change-form1" onclick="newParam()">


		<table width="100%" id="ria_pd_edit_form" class="adm-detail-content-table edit-table" hidden>
		<tr>
			<td align="right" width="40%" class="adm-detail-content-cell-l"><span class="adm-required-field"><?= GetMessage("EX_DOCUMENT_TITLE") ?>:</span></td>
			<td width="60%" class="adm-detail-content-cell-r">
				<input type="text" size="50" name="fri_title" id="id_fri_title" value="">
			</td>
		</tr>
		<tr>
			<td align="right" class="adm-detail-content-cell-l" width="40%"><span class="adm-required-field"><?= GetMessage("EX_DOCUMENT_NAME") ?>:</span></td>
			<td width="60%" class="adm-detail-content-cell-r">
				<input type="text" size="20" name="fri_name" id="id_fri_name" value="">
			</td>
		</tr>
		<tr>
			<td align="right" class="adm-detail-content-cell-l" width="40%"><span><?= GetMessage("EX_DOCUMENT_DESCR") ?>:</span></td>
			<td width="60%" class="adm-detail-content-cell-r">
            <textarea style="resize:none" name="fri_description" id="id_fri_description" rows="5" cols="52"></textarea>
			</td>
		</tr>
		<tr>
			<td align="right" width="40%" class="adm-detail-content-cell-l"><span class="adm-required-field"><?= GetMessage("EX_DOCUMENT_TYPE") ?>:</span></td>
			<td width="60%" class="adm-detail-content-cell-r">
				<select name="fri_type" id="id_fri_type">
				<option value="file">Файл</option>
				<option value="text">Текст</option>
				</select>
			</td>
		</tr>
		<tr>
			<td align="right" width="40%" class="adm-detail-content-cell-l"></td>
			<td width="60%" class="adm-detail-content-cell-r">
				<input type="hidden" name="fri_id" id="id_fri_id">
				<input type="button" value="<?= GetMessage("SAVE") ?>" onclick="BPRIAParamSaveForm()" id="dpsavebuttonform" />
				<input type="button" value="<?= GetMessage("CANCEL") ?>" onclick="changeForm();" id="dpcancelbuttonform" />
			</td>
		</tr>
	</table>
<script>
<?
foreach ($arCurrentValues["MapLinkDocument"] as $fieldKey => $documentFieldValue)
{
	?>
	AddCondition('<?= CUtil::JSEscape($documentFieldValue['name']) ?>', '<?= CUtil::JSEscape($documentFieldValue['variable']) ?>');
	<?
}
if (count($arCurrentValues) <= 0)
{
	?>AddCondition("", "");<?
}
?>
</script>
