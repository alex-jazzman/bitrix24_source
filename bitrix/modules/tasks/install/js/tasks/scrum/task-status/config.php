<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/task.status.bundle.css',
	'js' => 'dist/task.status.bundle.js',
	'rel' => [
		'main.core',
		'tasks.scrum.dod',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];