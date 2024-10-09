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
		'ui.dialogs.messagebox',
		'ui.form-elements.field',
		'ui.cnt',
		'intranet.reinvite',
		'main.core',
		'ui.icon-set.main',
		'ui.entity-selector',
	],
];