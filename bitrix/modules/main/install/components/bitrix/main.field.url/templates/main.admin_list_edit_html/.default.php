<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

/**
 * @var UrlUfComponent $component
 * @var array $arResult
 */
$component = $this->getComponent();
?>

<input
	<?= $component->getHtmlBuilder()->buildTagAttributes($arResult['attrList']) ?>
	value="<?= $arResult['additionalParameters']['VALUE'] ?>"
>
