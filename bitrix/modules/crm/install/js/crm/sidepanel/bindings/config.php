<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
	'js' => './dist/bindings.bundle.js',
	'rel' => [
		'main.core',
		'main.sidepanel',
	],
	'skip_core' => false,
];
