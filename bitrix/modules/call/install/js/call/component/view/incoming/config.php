<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/incoming.bundle.css',
	'js' => 'dist/incoming.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.asset.css.design-tokens',
		'call.component.ui.avatar',
		'call.component.ui.button',
		'call.component.ui.icon',
		'call.store',
		'ui.design-tokens',
		'ui.vue3',
	],
	'skip_core' => true,
];
