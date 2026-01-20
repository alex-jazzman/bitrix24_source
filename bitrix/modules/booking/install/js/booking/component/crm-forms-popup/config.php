<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/crm-forms-popup.bundle.css',
	'js' => 'dist/crm-forms-popup.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.component.help-desk-loc',
		'ui.vue3',
		'booking.const',
		'booking.component.button',
	],
	'skip_core' => true,
];
