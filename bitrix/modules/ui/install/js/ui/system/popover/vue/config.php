<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/vue.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.popover',
		'ui.vue3',
	],
	'skip_core' => false,
];
