<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/search-input.bundle.css',
	'js' => 'dist/search-input.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.elements.loader',
		'im.v2.const',
		'im.v2.lib.esc-manager',
		'im.v2.lib.utils',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];
