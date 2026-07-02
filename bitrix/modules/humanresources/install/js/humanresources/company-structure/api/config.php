<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/api.bundle.css',
	'js' => 'dist/api.bundle.js',
	'rel' => [
		'humanresources.company-structure.utils',
		'main.core',
		'ui.analytics',
		'ui.notification',
	],
	'skip_core' => false,
];