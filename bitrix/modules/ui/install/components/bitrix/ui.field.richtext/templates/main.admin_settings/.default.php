<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Text\HtmlFilter;

Loc::loadMessages(dirname(__DIR__, 2) . '/.default.php');

/** @var array $arResult */

$name = $arResult['additionalParameters']['NAME'] ?? '';

if (!empty($arResult['additionalParameters']['bVarsFromForm']))
{
	$settings = $GLOBALS[$name] ?? [];
}
elseif (isset($arResult['userField']['SETTINGS']) && is_array($arResult['userField']['SETTINGS']))
{
	$settings = $arResult['userField']['SETTINGS'];
}
else
{
	$settings = [];
}

$rows = (int)($settings['ROWS'] ?? 0);
$size = (int)($settings['SIZE'] ?? 0);
$minLength = (int)($settings['MIN_LENGTH'] ?? 0);
$maxLength = (int)($settings['MAX_LENGTH'] ?? 0);
$defaultValue = (string)($settings['DEFAULT_VALUE'] ?? '');

if ($rows < 1)
{
	$rows = 1;
}
if ($size < 1)
{
	$size = 20;
}
?>
<tr>
	<td><label for="<?= $name ?>_ROWS"><?= Loc::getMessage('UI_FIELD_RICH_TEXT_SETTINGS_ROWS') ?>:</label></td>
	<td>
		<input type="text" id="<?= $name ?>_ROWS" name="<?= $name ?>[ROWS]" size="20" maxlength="20" value="<?= $rows ?>">
	</td>
</tr>
<tr>
	<td><label for="<?= $name ?>_SIZE"><?= Loc::getMessage('UI_FIELD_RICH_TEXT_SETTINGS_SIZE') ?>:</label></td>
	<td>
		<input type="text" id="<?= $name ?>_SIZE" name="<?= $name ?>[SIZE]" size="20" maxlength="20" value="<?= $size ?>">
	</td>
</tr>
<tr>
	<td><label for="<?= $name ?>_MIN_LENGTH"><?= Loc::getMessage('UI_FIELD_RICH_TEXT_SETTINGS_MIN_LENGTH') ?>:</label></td>
	<td>
		<input type="text" id="<?= $name ?>_MIN_LENGTH" name="<?= $name ?>[MIN_LENGTH]" size="20" maxlength="20" value="<?= $minLength ?>">
	</td>
</tr>
<tr>
	<td><label for="<?= $name ?>_MAX_LENGTH"><?= Loc::getMessage('UI_FIELD_RICH_TEXT_SETTINGS_MAX_LENGTH') ?>:</label></td>
	<td>
		<input type="text" id="<?= $name ?>_MAX_LENGTH" name="<?= $name ?>[MAX_LENGTH]" size="20" maxlength="20" value="<?= $maxLength ?>">
	</td>
</tr>
<tr>
	<td><label for="<?= $name ?>_DEFAULT_VALUE"><?= Loc::getMessage('UI_FIELD_RICH_TEXT_SETTINGS_DEFAULT_VALUE') ?>:</label></td>
	<td>
		<textarea id="<?= $name ?>_DEFAULT_VALUE" name="<?= $name ?>[DEFAULT_VALUE]" cols="40" rows="3"><?= HtmlFilter::encode($defaultValue) ?></textarea>
	</td>
</tr>
