<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

$rows = (int)($arResult['userField']['SETTINGS']['ROWS'] ?? 0);
$cols = (int)($arResult['userField']['SETTINGS']['SIZE'] ?? 0);
$maxLength = (int)($arResult['userField']['SETTINGS']['MAX_LENGTH'] ?? 0);
$value = (string)($arResult['additionalParameters']['VALUE'] ?? '');

?>
<textarea
	name="<?= $arResult['additionalParameters']['NAME'] ?>"
	cols="<?= $cols > 0 ? $cols : 40 ?>"
	rows="<?= $rows > 1 ? $rows : 5 ?>"<?php if ($maxLength > 0): ?>
	maxlength="<?= $maxLength ?>"<?php endif; ?>
><?= $value ?></textarea>
