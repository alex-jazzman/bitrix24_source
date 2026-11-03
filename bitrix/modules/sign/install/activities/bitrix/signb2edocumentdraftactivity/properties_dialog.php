<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Loader;

if (!Loader::includeModule('sign'))
{
	die();
}

/** @var PropertiesDialog $dialog */

// the caller prints the result inside an already opened table, so the template gives out rows only
foreach ($dialog->getMap() as $field): ?>
	<tr>
		<td align="right" width="40%"><?= htmlspecialcharsbx((string)$field['Name']) ?>:</td>
		<td width="60%">
			<?= $dialog->renderFieldControl($field, null, true, FieldType::RENDER_MODE_DESIGNER) ?>
		</td>
	</tr>
<?php endforeach;
