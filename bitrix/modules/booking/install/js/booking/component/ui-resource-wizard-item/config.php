<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-resource-wizard-item.bundle.css',
	'js' => 'dist/ui-resource-wizard-item.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
		'booking.const',
		'booking.component.help-desk-loc',
	],
	'skip_core' => true,
];
