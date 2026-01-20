<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-popup-tabs.bundle.css',
	'js' => 'dist/ui-popup-tabs.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3',
		'ui.hint',
		'booking.component.popup',
		'booking.component.button',
		'booking.component.ui-tabs',
		'booking.component.ui-resource-wizard-item',
	],
	'skip_core' => false,
];
