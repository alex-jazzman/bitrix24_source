<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\IO\Path;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Web\Json;

\Bitrix\Main\UI\Extension::load(
	[
		'ui.buttons',
		'ui.hint',
		'ui.notification',
		'ui.alerts',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'bizproc.automation',
	]
);

$messages = array_merge(
	Loc::loadLanguageFile(
		\Bitrix\Main\Application::getDocumentRoot()
		. Path::normalize('/bitrix/components/bitrix/bizproc.automation/templates/.default/template.php')
	),
	Loc::loadLanguageFile(
		\Bitrix\Main\Application::getDocumentRoot()
		. Path::normalize('/bitrix/components/bitrix/bizproc.workflow.edit/templates/.default/template.php')
	),
);
Asset::getInstance()->addJs(Path::normalize('/bitrix/activities/bitrix/deletedatastorageactivity/script.js'));

/** @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog */
$map = $dialog->getMap();
?>
<?php foreach ($map as $field): ?>
	<?php if (isset($field['Name'], $field['Type'])): ?>
		<tr>
			<?php if ($field['FieldName'] === 'storage_code'): ?>
				<td></td>
			<?php else: ?>
				<td align="right" width="40%"><?= htmlspecialcharsbx($field['Name']) ?>:</td>
			<?php endif; ?>
			<td width="60%">
				<?=
				$dialog->getFieldTypeObject($field)->renderControl(
					[
						'Form' => $dialog->getFormName(),
						'Field' => $field['FieldName']
					],
					$dialog->getCurrentValue($field['FieldName']),
					$field['AllowSelection'] ?? true,
					0
				)
				?>
			</td>
		</tr>
	<?php endif; ?>
<?php endforeach; ?>

<tr data-role="bpa-sda-delete-mode-dependent">
	<td align="right" width="40%"><?= htmlspecialcharsbx($map['DynamicFilterFields']['Name']) ?>:</td>
	<td width="60%">
		<div data-role="bpa-sda-filter-fields-container"></div>
	</td>
</tr>

<script>
	BX.ready(function () {
		BX.message(<?= Json::encode($messages) ?>);
		BX.message(<?= Json::encode(Loc::loadLanguageFile($dialog->getActivityFile())) ?>);

		const ui = new BX.Bizproc.Activity.DeleteDataStorageActivity({
			documentType: <?= Json::encode($dialog->getDocumentType()) ?>,
			documentName: '<?= CUtil::JSEscape($dialog->getRuntimeData()['DocumentName']) ?>',
			documentFields: <?= Json::encode($dialog->getRuntimeData()['DocumentFields']) ?>,
			isRobot: false,
			formName: '<?= CUtil::JSEscape($dialog->getFormName()) ?>',
			filteringFieldsPrefix: '<?= CUtil::JSEscape($map['DynamicFilterFields']['FieldName']) ?>_',
			filterFieldsMap: <?= Json::encode($map['DynamicFilterFields']['Map']) ?>,
			conditions: <?= Json::encode($dialog->getCurrentValue('filter_fields')) ?>,
		});
		ui.init();
	})
</script>
