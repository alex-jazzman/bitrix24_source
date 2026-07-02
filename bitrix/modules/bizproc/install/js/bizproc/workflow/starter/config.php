<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/starter.bundle.css',
	'js' => 'dist/starter.bundle.js',
	'rel' => [
		'bizproc.router',
		'main.core',
		'main.core.events',
		'sidepanel',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.notification',
	],
	'skip_core' => false,
];
