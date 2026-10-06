<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

?>
<input
	type="text"
	name="<?= $arResult['additionalParameters']['NAME'] ?>"
	size="<?= (int)($arResult['userField']['SETTINGS']['SIZE'] ?? 0) ?>"
	value="<?= $arResult['additionalParameters']['VALUE'] ?? '' ?>"
>
