<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/analytics.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.analytics',
		'ui.uploader.core',
		'tasks.v2.core',
		'tasks.v2.const',
	],
	'skip_core' => true,
];
