<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-date-picker.bundle.css',
	'js' => 'dist/ui-date-picker.bundle.js',
	'rel' => [
		'main.core',
		'socialnetwork.v2.lib.calendar',
		'socialnetwork.v2.lib.timezone',
		'ui.date-picker',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.input.vue',
	],
	'skip_core' => false,
];
