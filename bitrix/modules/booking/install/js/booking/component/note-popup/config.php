<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/note-popup.bundle.css',
	'js' => 'dist/note-popup.bundle.js',
	'rel' => [
		'booking.component.button',
		'booking.component.popup',
		'booking.lib.resolvable',
		'main.core',
		'main.popup',
		'ui.vue3',
	],
	'skip_core' => false,
];
