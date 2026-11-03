<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/footer.bundle.css',
	'js' => 'dist/footer.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.block.camera-button',
		'call.component.block.microphone-button',
		'call.component.block.screen-share-button',
		'call.component.ui.badge',
		'call.component.ui.button',
		'call.component.ui.icon',
		'call.component.ui.tooltip',
		'call.helper.hotkey',
		'call.store',
		'ui.vue3',
	],
	'skip_core' => true,
];
