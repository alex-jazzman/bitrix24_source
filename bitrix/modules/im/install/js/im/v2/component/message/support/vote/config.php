<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/vote.bundle.css',
	'js' => 'dist/vote.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.message.base',
		'im.v2.const',
		'im.v2.lib.notifier',
		'main.core',
	],
	'skip_core' => false,
];