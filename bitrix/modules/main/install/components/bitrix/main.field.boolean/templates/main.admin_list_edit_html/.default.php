<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

/**
 * @var array $arResult
 */
?>

<input
	type="hidden"
	value="0"
	name="<?= $arResult['additionalParameters']['NAME'] ?>"
>
<input
	type="checkbox"
	value="1"
	name="<?= $arResult['additionalParameters']['NAME'] ?>"
	<?= ($arResult['additionalParameters']['VALUE'] ? ' checked' : '') ?>
>
