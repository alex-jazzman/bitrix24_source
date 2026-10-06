<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Bizproc\Activity\PropertiesDialog;

/** @var PropertiesDialog $dialog */

foreach ($dialog->getMap() as $fieldId => $field)
{
	?>
	<tr>
		<td align="right" width="40%">
			<?php if ($field['Required']): ?><span class="adm-required-field"><?php endif ?>
				<?= htmlspecialcharsbx($field['Name']) ?>:
			<?php if ($field['Required']): ?></span><?php endif ?>
		</td>
		<td width="60%">
			<?php
			$fieldType = $dialog->getFieldTypeObject($field);
			$data = [
				'Form' => $dialog->getFormName(),
				'Field' => $field['FieldName'],
			];
			print $fieldType->renderControl(
				$data,
				$dialog->getCurrentValue($field['FieldName']),
				true,
				0,
			);
			?>
		</td>
	</tr>
	<?php
}
