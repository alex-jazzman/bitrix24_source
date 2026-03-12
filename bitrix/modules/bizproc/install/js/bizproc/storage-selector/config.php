<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/storage-selector.bundle.css',
	'js' => 'dist/storage-selector.bundle.js',
	'rel' => [
		'main.core',
		'ui.entity-selector',
		'main.core.events',
	],
	'skip_core' => false,
];
