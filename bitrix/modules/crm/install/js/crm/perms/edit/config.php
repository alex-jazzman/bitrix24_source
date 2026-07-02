<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/edit.bundle.css',
	'js' => 'dist/edit.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.design-tokens',
		'ui.entity-selector',
		'ui.loader',
		'ui.sidepanel',
		'ui.sidepanel.layout',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];