<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/template-permissions-button.bundle.css',
	'js' => 'dist/template-permissions-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.lib.show-limit',
		'tasks.v2.component.elements.hover-pill',
		'ui.vue3.components.popup',
		'ui.system.typography.vue',
		'tasks.v2.provider.service.task-service',
		'ui.vue3.components.menu',
		'tasks.v2.component.elements.user-label',
		'ui.icon-set.api.vue',
		'ui.vue3.components.button',
		'ui.icon-set.outline',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.provider.service.template-service',
	],
	'skip_core' => true,
];
