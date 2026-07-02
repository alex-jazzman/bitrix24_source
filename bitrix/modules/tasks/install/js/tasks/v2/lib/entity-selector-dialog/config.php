<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/entity-selector-dialog.bundle.css',
	'js' => 'dist/entity-selector-dialog.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.entity-selector',
	],
	'skip_core' => true,
];
