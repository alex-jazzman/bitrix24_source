<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/ai-task.bundle.js',
    'css' => './dist/ai-task.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.lib.message-component',
		'im.v2.lib.notifier',
		'im.v2.lib.rest',
	],
    'skip_core' => true,
];
