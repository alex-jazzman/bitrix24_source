<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\UI\Format\BBCode\Converter;

/** @var array $arResult */

foreach ($arResult['value'] as $value)
{
	$html = Converter::toHtml((string)($value ?? ''));
	if ($html === '')
	{
		continue;
	}
	?><div class="ui-field-rich-text"><?= $html ?></div><?php
}
