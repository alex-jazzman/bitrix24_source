<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/microphone-button.bundle.js',
	'css' => './dist/microphone-button.bundle.css',
	'rel' => [
		'main.polyfill.core',
		'call.component.ui.button',
		'call.component.ui.icon',
		'call.component.ui.tooltip',
		'call.helper.hotkey',
		'call.store',
		'ui.vue3',
	],
	'skip_core' => true,
];
