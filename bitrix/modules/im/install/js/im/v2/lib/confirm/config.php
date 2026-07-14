<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.channel',
		'im.v2.lib.collab',
		'main.core',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];
