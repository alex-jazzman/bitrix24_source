<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/attach.bundle.css',
	'js' => 'dist/attach.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.parser',
		'im.v2.lib.utils',
		'main.core',
		'ui.icons.disk',
		'ui.vue3.directives.lazyload',
	],
	'skip_core' => false,
];
