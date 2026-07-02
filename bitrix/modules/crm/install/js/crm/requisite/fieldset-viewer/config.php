<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/fieldset-viewer.bundle.css',
	'js' => 'dist/fieldset-viewer.bundle.js',
	'rel' => [
		'crm.field.list-editor',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.buttons',
	],
	'skip_core' => false,
];