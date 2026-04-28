<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/partner-discontinue.bundle.css',
	'js' => 'dist/partner-discontinue.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.icon-set.outlined',
	],
	'skip_core' => false,
];
