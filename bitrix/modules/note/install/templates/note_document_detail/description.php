<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$arTemplate = [
	'NAME' => Loc::getMessage('NOTE_TEMPLATE_NAME'),
	'DESCRIPTION' => Loc::getMessage('NOTE_TEMPLATE_DESC'),
];
