<?php

use Bitrix\Bizproc\Internal\Service\DataView\ColumnFormula;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

// Extension configs are read before the module they belong to is loaded, so nothing here is
// autoloadable until it is.
$settings = [];
if (Loader::includeModule('bizproc'))
{
    $settings['allowedFormulaFunctions'] = array_keys(ColumnFormula::allowedFunctions());
}

return [
    'js' => './dist/dataview.bundle.js',
    'rel' => [
		'main.core',
	],
    'skip_core' => false,
    'settings' => $settings,
];
