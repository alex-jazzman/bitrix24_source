<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => [
		'dist/grid.bundle.js'
	],
	'skip_core' => false,
	'rel' => [
		'ui.label',
		'main.popup',
		'ui.dialogs.messagebox',
		'ui.cnt',
		'main.core',
		'ui.icon-set.main',
		'ui.entity-selector',
	],
];