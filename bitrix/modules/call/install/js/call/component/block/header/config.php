<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/header.bundle.css',
	'js' => 'dist/header.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.block.record-indicator',
		'call.component.ui.button',
		'call.component.ui.icon',
		'call.component.ui.logo',
		'call.component.ui.tooltip',
		'call.store',
		'ui.vue3',
	],
	'skip_core' => true,
];
