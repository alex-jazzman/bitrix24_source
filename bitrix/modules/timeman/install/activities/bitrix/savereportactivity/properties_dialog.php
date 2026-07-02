<?php

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var PropertiesDialog $dialog */

foreach ($dialog->getMap() as $fieldId => $field): ?>

	<?php $isFieldRequired = CBPHelper::getBool($field['Required'] ?? false); ?>

	<tr>
		<td align="right" width="40%">
			<?php if ($isFieldRequired): ?>
				<span class="adm-required-field" >
			<?php endif ?>

			<?= htmlspecialcharsbx($field['Name']) ?>:

			<?php if ($isFieldRequired): ?>
				</span>
			<?php endif ?>
		</td>
		<td width="60%" >
			<?= $dialog->renderFieldControl($field, null, CBPHelper::getBool($field['AllowSelection'] ?? true), FieldType::RENDER_MODE_DESIGNER) ?>
		</td>
	</tr>

<?php endforeach;
