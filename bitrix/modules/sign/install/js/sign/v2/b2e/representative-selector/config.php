<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/representative-selector.bundle.css',
	'js' => 'dist/representative-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'sign.v2.b2e.user-selector',
		'sign.v2.helper',
		'sign.type',
	],
	'skip_core' => false,
];