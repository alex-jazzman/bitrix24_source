<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/collection-picker.bundle.js',
	'css' => './dist/collection-picker.bundle.css',
	'rel' => [
		'main.core',
		'note.ui.theme-context',
		'ui.buttons',
		'ui.entity-selector',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
