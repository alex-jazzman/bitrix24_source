<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Text\HtmlFilter;

Loc::loadMessages(dirname(__DIR__, 2) . '/.default.php');

/** @var array $arResult */

$userField = $arResult['userField'];
$fieldName = (string)($userField['FIELD_NAME'] ?? '');
$isMultiple = ($userField['MULTIPLE'] ?? 'N') === 'Y';
$disabled = ($userField['EDIT_IN_LIST'] ?? 'Y') !== 'Y';

$rows = (int)($userField['SETTINGS']['ROWS'] ?? 0);
$cols = (int)($userField['SETTINGS']['SIZE'] ?? 0);
$maxLength = (int)($userField['SETTINGS']['MAX_LENGTH'] ?? 0);

$rawValue = $userField['VALUE'] ?? '';
$values = is_array($rawValue) ? $rawValue : [$rawValue];
if (empty($values))
{
	$values = [''];
}

?>
<table id="table_<?= $fieldName ?>">
	<?php foreach ($values as $key => $value): ?>
		<?php $inputName = $isMultiple ? $fieldName . '[' . $key . ']' : $fieldName; ?>
		<tr>
			<td>
				<textarea
					name="<?= $inputName ?>"
					cols="<?= $cols > 0 ? $cols : 40 ?>"
					rows="<?= $rows > 1 ? $rows : 5 ?>"<?php if ($maxLength > 0): ?>
					maxlength="<?= $maxLength ?>"<?php endif; ?><?php if ($disabled): ?>
					disabled="disabled"<?php endif; ?>
				><?= HtmlFilter::encode((string)($value ?? '')) ?></textarea>
			</td>
		</tr>
	<?php endforeach; ?>
	<?php if ($isMultiple): ?>
		<tr>
			<td style="padding-top: 6px;">
				<input
					type="button"
					value="<?= HtmlFilter::encode((string)Loc::getMessage('UI_FIELD_RICH_TEXT_ADD')) ?>"
					onclick="addNewRow('table_<?= $fieldName ?>', '<?= str_replace('_', 'x', $fieldName) ?>|<?= $fieldName ?>|<?= $fieldName ?>_old_id')"
				>
			</td>
		</tr>
	<?php endif; ?>
</table>
