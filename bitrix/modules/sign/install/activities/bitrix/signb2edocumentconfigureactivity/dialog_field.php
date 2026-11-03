<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Main\Localization\Loc;

/**
 * Control of one settings field, shared by the designer and the robot dialog: a field whose value
 * comes from a dictionary gets the select button of that dictionary, any other one gets the
 * platform control as it is.
 *
 * @var PropertiesDialog $dialog
 * @var string $fieldId
 * @var array $field
 * @var string $fieldRenderMode
 */

// data-role is reserved by the bizproc selector manager, dictionary fields are marked by an own attribute
$dictionaryFields = [
	CBPSignB2EDocumentConfigureActivity::PARAM_COMPANY => 'company',
	CBPSignB2EDocumentConfigureActivity::PARAM_PROVIDER_CODE => 'provider',
];
$dictionary = $dictionaryFields[$fieldId] ?? null;
?>
<?php if ($dictionary === null): ?>
	<?= $dialog->renderFieldControl(field: $field, renderMode: $fieldRenderMode) ?>
<?php else: ?>
	<div
		class="sign-b2e-configure-activity__dictionary"
		data-sign-dictionary="<?= htmlspecialcharsbx($dictionary) ?>"
	>
		<?= $dialog->renderFieldControl(field: $field, renderMode: $fieldRenderMode) ?>
		<button
			type="button"
			class="ui-btn ui-btn-light-border sign-b2e-configure-activity__dictionary-button"
		><?= htmlspecialcharsbx((string)Loc::getMessage('SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_SELECT')) ?></button>
	</div>
<?php endif; ?>
