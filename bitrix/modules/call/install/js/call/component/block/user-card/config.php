<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-card.bundle.css',
	'js' => 'dist/user-card.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.ui.avatar',
		'call.component.ui.icon',
		'call.component.ui.signal',
		'call.component.ui.video',
		'call.store',
		'ui.vue3',
	],
	'skip_core' => true,
];
