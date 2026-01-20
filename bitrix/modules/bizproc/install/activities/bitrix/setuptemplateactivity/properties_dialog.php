<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\FieldType;
use Bitrix\Main;

Bitrix\Main\UI\Extension::load([
	'bizproc.setup-template-activity',
	'bizproc.setup-template',
]);

/** @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog */
/** @var array<string, string> $typeNames */

$domElementId = 'bizprocSetupTemplateActivityElement';
foreach ($dialog->getMap() as $fieldId => $field): ?>
	<?php if(($field['Type'] ?? null) !== FieldType::CUSTOM) : ?>
	<tr>
		<td align="right" width="40%"><?= htmlspecialcharsbx($field['Name']) ?>:</td>
		<td width="60%">
			<?= $dialog->renderFieldControl(
				$field,
				null,
				false,
				FieldType::RENDER_MODE_DESIGNER
			) ?>
		</td>
	</tr>
	<?php endif; ?>
<?php endforeach; ?>

<tr>
	<td colspan="2" width="100%" class="bizproc-setuptemplateactivity-wrap">
		<div id="<?= htmlspecialcharsbx($domElementId) ?>"></div>
	</td>
</tr>

<script>
	BX.ready(() => {
		BX.message(<?=Main\Web\Json::encode(Main\Localization\Loc::loadLanguageFile(__FILE__)) ?>);


		const activity = new BX.Bizproc.SetupTemplateActivity({
			currentValues: <?= Main\Web\Json::encode($dialog->getCurrentValues()) ?>,
			domElementId: '<?= CUtil::JSEscape($domElementId) ?>',
			fieldTypeNames:  <?= Main\Web\Json::encode($typeNames) ?>
		});
		activity.init();

		BX.Event.EventEmitter.subscribe('BX.Bizproc.Activity.unmount', () => activity.unmount());
	});
</script>
