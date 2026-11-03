<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/settings-button.bundle.css',
	'js' => 'dist/settings-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.const',
		'im.v2.css.classes',
		'im.v2.lib.analytics',
		'im.v2.lib.feature',
		'im.v2.lib.layout',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => true,
];
