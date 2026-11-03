<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/result.bundle.css',
	'js' => 'dist/result.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.analytics',
	],
	'skip_core' => false,
];