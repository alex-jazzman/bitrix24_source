<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog
 */

foreach ($dialog->getMap() as $fieldId => $field): ?>
	<tr>
		<td align="right" width="40%">
			<?php
			if (CBPHelper::getBool($field['Required'] ?? false)): ?>
			<span class="adm-required-field">
            <?php
			endif;
			echo htmlspecialcharsbx($field['Name']) ?>:
            <?php if (CBPHelper::getBool($field['Required'] ?? false)): ?>
                </span>
		<?php endif ?>
		</td>
		<td width="60%">
			<?= $dialog->renderFieldControl($field, null, true, \Bitrix\Bizproc\FieldType::RENDER_MODE_DESIGNER) ?>
		</td>
	</tr>
<?php endforeach;