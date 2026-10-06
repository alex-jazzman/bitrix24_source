<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/folder.bundle.js',
    'css' => './dist/folder.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.folder',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.rest',
	],
    'skip_core' => true,
];
