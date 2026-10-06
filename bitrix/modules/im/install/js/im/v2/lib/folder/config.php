<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/folder.bundle.js',
	'css' => './dist/folder.bundle.css',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'im.v2.lib.notifier',
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
