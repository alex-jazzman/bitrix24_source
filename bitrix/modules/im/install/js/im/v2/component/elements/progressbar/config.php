<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/progressbar.bundle.css',
	'js' => 'dist/progressbar.bundle.js',
	'rel' => [
		'im.v2.const',
		'main.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
