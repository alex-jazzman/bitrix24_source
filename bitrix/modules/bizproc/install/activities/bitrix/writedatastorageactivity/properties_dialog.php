<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/**
 * @var PropertiesDialog $dialog
 * @var CBPDocumentService $documentService
 */

Asset::getInstance()->addJs(getLocalPath('activities/bitrix/writedatastorageactivity/script.js'));
Extension::load(['ui.entity-selector', 'bizproc.router']);

$map = $dialog->getMap();
$fieldValues = array_column($dialog->getCurrentValues()['Fields'] ?? [], 'Value', 'FieldName');
$runtime = $dialog->getRuntimeData();

//$mode = $dialog->getCurrentValue('RewriteMode');
//$map['ItemId']['Hidden'] = $mode === 'newItem' || !$mode;

foreach ($map as $id => $field): ?>
<tr <?= $field['Hidden'] ?? null ? 'hidden' : '' ?> data-cid="<?=htmlspecialcharsbx($field['FieldName'])?>">
	<?php if ($field['FieldName'] === 'StorageCode'): ?>
		<td></td>
	<?php else: ?>
		<td align="right" width="40%" valign="top">
			<span class="adm-required-field"><?= htmlspecialcharsbx($field['Name'])?>:</span>
		</td>
	<?php endif; ?>
	<td width="60%">
		<?php if ($field['FieldName'] === 'StorageId'): ?>
			<div data-role="start-storage-selector"></div>
		<?php endif; ?>
			<?= $dialog->renderFieldControl(
				$field,
				null,
				$field['AllowSelection'] ?? true,
				FieldType::RENDER_MODE_DESIGNER,
			) ?>
		<?//php endif; ?>
	</td>
</tr>
<?php endforeach; ?>
<tr>
	<td><a href="#" id="add_field"><?= Loc::getMessage('BIZPROC_WRITE_DATA_ACTIVITY_ADD_FIELD')?></a></td>
</tr>
<tr>
	<td colspan="2">
		<table width="100%" border="0" cellpadding="2" cellspacing="2" id="fieldsContainer"></table>
	</td>
</tr>
<script>
	BX.message({
		BIZPROC_WRITE_DATA_ACTIVITY_CREATE_NEW_FIELD: '<?= GetMessageJS('BIZPROC_WRITE_DATA_ACTIVITY_CREATE_NEW_FIELD') ?>',
		BIZPROC_WRITE_DATA_ACTIVITY_CREATE_NEW_STORAGE: '<?= GetMessageJS('BIZPROC_WRITE_DATA_ACTIVITY_CREATE_NEW_STORAGE') ?>',
		BIZPROC_WRITE_DATA_ACTIVITY_STORAGE_TAB_TITLE: '<?= GetMessageJS('BIZPROC_WRITE_DATA_ACTIVITY_STORAGE_TAB_TITLE') ?>',
		BIZPROC_WRITE_DATA_ACTIVITY_OPEN_STORAGE_LIST: '<?= GetMessageJS('BIZPROC_WRITE_DATA_ACTIVITY_OPEN_STORAGE_LIST') ?>',
		BIZPROC_WRITE_DATA_ACTIVITY_STORAGE_CODE: '<?= GetMessageJS('BIZPROC_WRITE_DATA_ACTIVITY_STORAGE_CODE') ?>',
		BIZPROC_WRITE_DATA_ACTIVITY_ANOTHER_FIELD: '<?= GetMessageJS('BIZPROC_WRITE_DATA_ACTIVITY_ANOTHER_FIELD') ?>',
	})

	BX.Event.ready(() => {
		if (BX.Bizproc.Activity.WriteDataStorageActivity)
		{
			const WriteDataStorageActivity = new BX.Bizproc.Activity.WriteDataStorageActivity({
				fieldsContainer: document.getElementById('fieldsContainer'),
				storageSelectorContainer: document.querySelector('[data-role="start-storage-selector"]'),
				storageIdField: document.querySelector('[name="StorageId"]'),
				storageCodeField: document.querySelector('[name="StorageCode"]'),
				modeField: document.querySelector('[name="RewriteMode"]'),
				documentType: <?= Json::encode($dialog->getDocumentType()) ?>,
				addFieldButton: document.getElementById('add_field'),
				currentValues: <?= Json::encode($fieldValues ?? []) ?>,
				fields: <?= Json::encode($runtime['fields'] ?? []) ?>,
				systemFields: <?= Json::encode($runtime['systemFields'] ?? []) ?>,
				storageItems: <?= Json::encode($map['StorageId']['Options'] ?? []) ?>,
			});
		}
	});
</script>

