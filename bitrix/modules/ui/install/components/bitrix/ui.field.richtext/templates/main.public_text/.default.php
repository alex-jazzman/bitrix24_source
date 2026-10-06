<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Text\HtmlFilter;
use Bitrix\UI\Format\BBCode\Converter;

/** @var array $arResult */

$parts = [];
foreach ($arResult['value'] as $value)
{
	$text = Converter::toPlainText((string)($value ?? ''));
	if ($text !== '')
	{
		$parts[] = $text;
	}
}

print HtmlFilter::encode(implode(', ', $parts));
