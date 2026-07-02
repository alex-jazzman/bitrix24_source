<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/list-editor.bundle.css',
	'js' => 'dist/list-editor.bundle.js',
	'rel' => [
		'"ui.layout-form',
		'crm.form.fields.selector',
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.buttons',
		'ui.draganddrop.draggable',
		'ui.forms',
		'ui.notification',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];