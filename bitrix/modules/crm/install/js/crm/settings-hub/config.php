<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/settings-hub.bundle.js',
    'css' => './dist/settings-hub.bundle.css',
    'rel' => [
		'main.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.switcher',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
		'ui.vue3.mixins.loc-mixin',
	],
    'skip_core' => false,
];
