<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/edit.bundle.css',
	'js' => 'dist/edit.bundle.js',
	'rel' => [
		'ui.buttons',
		'ui.sidepanel',
		'ui.sidepanel.layout',
		'ui.vue3',
		'ui.design-tokens',
		'ui.vue3.vuex',
		'main.core',
		'ui.loader',
	],
	'skip_core' => false,
];