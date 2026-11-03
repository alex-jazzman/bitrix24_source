<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call.bundle.css',
	'js' => 'dist/call.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.block.footer',
		'call.component.block.header',
		'call.component.block.user-card',
		'call.component.ui.avatar',
		'call.component.ui.icon',
		'call.store',
		'ui.vue3',
	],
	'skip_core' => true,
];
