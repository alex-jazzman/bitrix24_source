<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => 'dist/grid.bundle.js',
	'rel' => [
		'main.popup',
		'im.public',
		'humanresources.company-structure.public',
		'ui.avatar',
		'main.date',
		'ui.buttons',
		'ui.system.typography',
		'main.core.events',
		'ui.dialogs.messagebox',
		'main.core',
	],
	'skip_core' => false,
];
