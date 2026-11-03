<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/kanban-sort.bundle.css',
	'js' => 'dist/kanban-sort.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.a11y',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];