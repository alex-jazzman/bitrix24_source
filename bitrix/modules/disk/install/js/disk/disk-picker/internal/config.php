<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/internal.bundle.js',
    'css' => './dist/internal.bundle.css',
    'rel' => [
		'main.core',
		'main.date',
		'main.polyfill.intersectionobserver',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.icon-set.api.disk',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.avatar',
		'ui.vue3.components.button',
		'ui.vue3.pinia',
	],
    'skip_core' => false,
];
