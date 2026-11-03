<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => './dist/expression-builder.bundle.css',
	'js' => './dist/expression-builder.bundle.js',
	'rel' => [
		'main.core',
		'ui.a11y',
		'ui.design-tokens',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];
