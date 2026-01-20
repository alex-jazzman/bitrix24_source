<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.fonts.opensans',
		'main.polyfill.intersectionobserver',
		'ui.icon-set.api.vue',
		'im.v2.lib.utils',
		'im.v2.component.animation',
		'main.core.events',
		'im.v2.const',
	],
	'skip_core' => true,
];
