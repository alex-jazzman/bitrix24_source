<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/data-structures.bundle.css',
	'js' => 'dist/data-structures.bundle.js',
	'rel' => [
		'crm_common',
		'main.core',
	],
	'skip_core' => false,
];
