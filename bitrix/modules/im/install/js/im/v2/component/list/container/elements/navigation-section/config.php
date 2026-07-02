<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/navigation-section.bundle.css',
	'js' => 'dist/navigation-section.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.counter',
		'ui.system.chip.vue',
	],
	'skip_core' => true,
];