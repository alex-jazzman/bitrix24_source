<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/admin-money-field.bundle.js',
    'rel' => [
		'currency.currency-core',
		'main.core',
	],
    'skip_core' => false,
];
