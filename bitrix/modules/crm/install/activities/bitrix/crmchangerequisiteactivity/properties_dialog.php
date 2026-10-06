<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();
/** @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog */

\Bitrix\Main\Page\Asset::getInstance()->addJs(getLocalPath('activities/bitrix/crmchangerequisiteactivity/script.js'));

include ($dialog->getRuntimeData()['PathToParentClassDir'] . DIRECTORY_SEPARATOR . 'properties_dialog.php');

CJSCore::Init('bp_field_type');

// several settings dialogs may live in the same document, so element ids are bound to the activity
$dialogUid = hash('sha256', (string)$dialog->getActivityName());
$listFormRowId = 'ccra_pd_list_form_' . $dialogUid;
$requisiteFieldsNodeId = 'bca_ccra_requisite_fields_' . $dialogUid;
$addConditionLinkId = 'id_bca_ccra_add_condition_' . $dialogUid;
?>

<tr id="<?= htmlspecialcharsbx($listFormRowId) ?>" data-testid="crm-change-requisite-activity-designer-form">
	<td colspan="2">
		<table
			id="<?= htmlspecialcharsbx($requisiteFieldsNodeId) ?>"
			width="100%"
			border="0"
			cellpadding="2"
			cellspacing="2"
			data-testid="crm-change-requisite-activity-fields"
		>
		</table>
		<a
			id="<?= htmlspecialcharsbx($addConditionLinkId) ?>"
			href="#"
			data-testid="crm-change-requisite-activity-add-condition"
		><?= GetMessage('CRM_CRA_ADD_CONDITION') ?></a>
		<span id="bwfvc_container"></span>
	</td>
</tr>

<script>
	BX.ready(function()
	{
		BX.Crm.Activity.CrmChangeRequisiteActivity.init({
			requisiteFieldsNodeId: <?= \Bitrix\Main\Web\Json::encode($requisiteFieldsNodeId) ?>,
			addConditionLinkId: <?= \Bitrix\Main\Web\Json::encode($addConditionLinkId) ?>,
			documentType: <?= \Bitrix\Main\Web\Json::encode($dialog->getDocumentType()) ?>,

			requisiteFieldsMap: <?= \Bitrix\Main\Web\Json::encode($dialog->getRuntimeData()['RequisiteFieldsMap']) ?>,
			bankDetailFieldsMap: <?= \Bitrix\Main\Web\Json::encode($dialog->getRuntimeData()['BankDetailFieldsMap']) ?>,
			addressFieldsMap: <?= \Bitrix\Main\Web\Json::encode($dialog->getRuntimeData()['AddressFieldsMap']) ?>,

			currentValues: <?= \Bitrix\Main\Web\Json::encode($dialog->getCurrentValues()['FieldsValues']) ?>,

			presetFieldNames: <?= \Bitrix\Main\Web\Json::encode($dialog->getRuntimeData()['PresetRequisiteFieldNames']) ?>,
			selectPresetNodeId: "id_" + "<?=$dialog->getMap()['RequisitePresetId']['FieldName']?>",
			messages: {
				"CRM_CRA_DELETE_CONDITION": "<?= GetMessage('CRM_CRA_DELETE_CONDITION') ?>"
			}
		});
	});
</script>
