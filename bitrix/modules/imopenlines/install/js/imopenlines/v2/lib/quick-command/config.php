<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/quick-command.bundle.css',
	'js' => 'dist/quick-command.bundle.js',
	'rel' => [
		'im.v2.component.textarea',
		'im.v2.const',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];
