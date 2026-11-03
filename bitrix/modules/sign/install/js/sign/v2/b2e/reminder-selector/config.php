<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/reminder-selector.bundle.css',
	'js' => 'dist/reminder-selector.bundle.js',
	'rel' => [
		'main.core',
		'sign.type',
		'sign.v2.api',
		'ui.buttons',
	],
	'skip_core' => false,
];