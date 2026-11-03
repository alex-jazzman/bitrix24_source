<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/vue.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.callout',
		'ui.system.popover',
		'ui.system.popover.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];
