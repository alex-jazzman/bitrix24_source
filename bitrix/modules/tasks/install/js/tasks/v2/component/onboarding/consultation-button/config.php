<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/consultation-button.bundle.css',
	'js' => 'dist/consultation-button.bundle.js',
	'rel' => [
		'main.core',
		'spotlight',
		'tasks.v2.component.elements.hint',
		'ui.banner-dispatcher',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => false,
];
