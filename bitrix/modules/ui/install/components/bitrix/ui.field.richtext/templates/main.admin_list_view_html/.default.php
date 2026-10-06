<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\UI\Format\BBCode\Converter;

/** @var array $arResult */

$html = Converter::toHtml(htmlspecialcharsback((string)($arResult['additionalParameters']['VALUE'] ?? '')));

print $html !== '' ? $html : '&nbsp;';
