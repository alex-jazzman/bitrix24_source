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
		'booking.component.help-desk-loc',
		'booking.const',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];
