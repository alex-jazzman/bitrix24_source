<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Loader;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;

if (!Loader::includeModule('sign'))
{
	die();
}

/** @var PropertiesDialog $dialog */

Asset::getInstance()->addJs(getLocalPath('activities/bitrix/signb2edocumentconfigureactivity/script.js'));
Asset::getInstance()->addCss(getLocalPath('activities/bitrix/signb2edocumentconfigureactivity/style.css'));

Extension::load([
	'ui.forms',
	'ui.hint',
	'ui.buttons',
	'main.popup',
]);

// the robot dialog carries the context every field selector needs, so all of them render as public
$fieldRenderMode = FieldType::RENDER_MODE_PUBLIC;
?>
<?php foreach ($dialog->getMap() as $fieldId => $field): ?>
	<div class="bizproc-automation-popup-settings">
		<div class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-top bizproc-automation-popup-settings-title-autocomplete">
			<?= htmlspecialcharsbx((string)($field['Name'] ?? '')) ?>:
			<?php if ($field['Hint'] ?? null): ?>
				<span data-hint="<?= htmlspecialcharsbx((string)$field['Hint']) ?>"></span>
			<?php endif; ?>
		</div>
		<?php require __DIR__ . '/dialog_field.php'; ?>
	</div>
<?php endforeach; ?>
<?php require __DIR__ . '/dialog_script.php'; ?>
