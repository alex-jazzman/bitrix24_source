<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/application.bundle.js',
    'css' => './dist/application.bundle.css',
    'rel' => [
		'main.core',
		'ui.buttons',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.switcher',
		'ui.system.input.vue',
		'ui.system.label',
		'ui.system.label.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'ui.vue3.components.switcher',
		'ui.vue3.mixins.loc-mixin',
	],
    'skip_core' => false,
];
