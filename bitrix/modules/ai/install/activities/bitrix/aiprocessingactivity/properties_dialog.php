<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;

Loc::loadMessages(__FILE__);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Asset::getInstance()->addJs('/bitrix/activities/bitrix/aiprocessingactivity/script.js');

/** @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog */

$currentReturnType = $dialog->getCurrentValue('returnType');
$stringType = CBPAiProcessingActivity::RETURN_TYPE_STRING;
$jsonType = CBPAiProcessingActivity::RETURN_TYPE_JSON;
$showJson = $currentReturnType === $stringType;

$messages = [
	'valid' => Loc::getMessage('AI_NODE_BP_JSON_VALID'),
	'invalid' => Loc::getMessage('AI_NODE_BP_JSON_INVALID'),
	'confirmOverwrite' => Loc::getMessage('AI_NODE_BP_JSON_CONFIRM_OVERWRITE'),
];
?>
<style>
	<?= Asset::getInstance()->insertCss('/bitrix/activities/bitrix/aiprocessingactivity/style.css');?>
</style>
<?php
foreach ($dialog->getMap() as $fieldId => $field):
	$isReturnType = ($fieldId === 'returnType');
	$isJson = ($fieldId === 'jsonSchema');
	$rowId = 'row_' . htmlspecialcharsbx($fieldId);
	$required = CBPHelper::getBool($field['Required'] ?? false);
	$hiddenClass = ($isJson && !$showJson) ? ' ai-node-bp-json-row--hidden' : '';
	?>
	<tr id="<?= $rowId ?>" class="ai-node-bp-json-row<?= $hiddenClass ?>">
		<td class="adm-detail-content-cell-l ai-node-bp-json-cell-l<?= $required ? ' ai-node-bp-json-cell-l--required' : '' ?>">
			<?= $required ? '<span class="adm-required-field">' : '' ?><?= htmlspecialcharsbx($field['Name']) ?>:<?= $required ? '</span>' : '' ?>
		</td>
		<td class="adm-detail-content-cell-r ai-node-bp-json-cell-r">
			<?php if ($isReturnType): ?>
				<div class="ai-node-bp-json-return-type-tabs-wrapper">
					<div class="node-settings-tabs ai-node-bp-json-return-type-tabs" id="ai-node-bp-json-return-type-tabs">
						<button type="button" class="node-settings-tab ai-act-tab <?= $currentReturnType === $stringType
							? '--active is-active' : '' ?>" data-value="<?=$stringType?>">
							<?= htmlspecialcharsbx(Loc::getMessage('AI_PROCESSING_ACTIVITY_RETURN_TYPE_STRING')) ?>
						</button>
						<button type="button" class="node-settings-tab ai-act-tab <?= $currentReturnType === $jsonType
							? '--active is-active' : '' ?>" data-value="<?=$jsonType?>"">
							<?= htmlspecialcharsbx(Loc::getMessage('AI_PROCESSING_ACTIVITY_RETURN_TYPE_JSON')) ?>
						</button>
					</div>
					<div class="ai-node-bp-json-hidden-field" style="display:none;">
						<?= $dialog->renderFieldControl($field, null, true, \Bitrix\Bizproc\FieldType::RENDER_MODE_DESIGNER) ?>
					</div>
				</div>
			<?php elseif ($isJson): ?>
				<div class="ai-node-bp-json-schema-wrapper">
					<div class="ai-node-bp-json-field-control"><?= $dialog->renderFieldControl($field, null, true, \Bitrix\Bizproc\FieldType::RENDER_MODE_DESIGNER) ?></div>
					<div id="ai-node-bp-json-schema-status" class="ai-node-bp-json-schema-status">
						<span class="status-dot"></span><span class="status-text ai-ai-node-bp-json-status-text"></span>
					</div>
					<div class="ai-node-bp-json-actions-row">
						<button type="button" class="node-settings-button --save ui-btn ui-btn-primary ui-btn-md" id="ai-node-bp-json-schema-template-btn">
							<?= htmlspecialcharsbx(Loc::getMessage('AI_PROCESSING_ACTIVITY_JSON_SCHEMA_TEMPLATE_BTN')) ?>
						</button>
						<?php if (!empty($field['Description'])): ?>
							<span class="ai-node-bp-json-field-description"><?= htmlspecialcharsbx($field['Description']) ?></span>
						<?php endif; ?>
					</div>
				</div>
			<?php else: ?>
				<div class="ai-node-bp-json-field-control"><?= $dialog->renderFieldControl($field, null, true, \Bitrix\Bizproc\FieldType::RENDER_MODE_DESIGNER) ?></div>
			<?php endif; ?>
		</td>
	</tr>
<?php endforeach; ?>

<script>
	BX.ready(function() {
		if (BX.AiNodeBpJsonEditor)
		{
			BX.AiNodeBpJsonEditor.init(<?= \Bitrix\Main\Web\Json::encode($messages) ?>);
		}
	});
</script>
