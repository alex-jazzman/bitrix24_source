<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
	'js' => './dist/call-assessment-v2.bundle.js',
	'css' => './dist/call-assessment-v2.bundle.css',
	'rel' => [
		'crm.ai.name-service',
		'main.core',
		'main.core.events',
		'main.date',
		'ui.design-tokens',
		'ui.draganddrop.draggable',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.switcher',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.hint',
		'ui.vue3.components.rich-loc',
		'ui.vue3.components.switcher',
		'ui.vue3.directives.hint',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => false,
];
