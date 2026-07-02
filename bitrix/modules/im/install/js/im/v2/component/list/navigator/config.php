<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/navigator.bundle.css',
	'js' => 'dist/navigator.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.list.container.collab',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'main.core.events',
	],
	'skip_core' => true,
];
