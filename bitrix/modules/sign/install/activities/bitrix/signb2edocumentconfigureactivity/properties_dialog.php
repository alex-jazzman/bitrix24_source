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

// user selectors of the public render mode rely on the robot dialog context, unavailable here
$designerModeFields = [
	CBPSignB2EDocumentConfigureActivity::PARAM_REPRESENTATIVE,
	CBPSignB2EDocumentConfigureActivity::PARAM_SIGNERS,
];
?>
<?php foreach ($dialog->getMap() as $fieldId => $field): ?>
	<tr class="sign-b2e-configure-activity__row">
		<td align="right" width="40%">
			<span<?= ($field['Required'] ?? false) ? ' class="adm-required-field"' : '' ?>>
				<?= htmlspecialcharsbx((string)($field['Name'] ?? '')) ?>:
			</span>
			<?php if ($field['Hint'] ?? null): ?>
				<span data-hint="<?= htmlspecialcharsbx((string)$field['Hint']) ?>"></span>
			<?php endif; ?>
		</td>
		<td width="60%">
			<?php
			$fieldRenderMode = in_array($fieldId, $designerModeFields, true)
				? FieldType::RENDER_MODE_DESIGNER
				: FieldType::RENDER_MODE_PUBLIC
			;
			require __DIR__ . '/dialog_field.php';
			?>
		</td>
	</tr>
<?php endforeach; ?>
<?php require __DIR__ . '/dialog_script.php'; ?>
