<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/participants.bundle.css',
	'js' => 'dist/participants.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'tasks.v2.component.absence-popup',
		'tasks.v2.component.elements.field-add',
		'tasks.v2.component.elements.field-hover-button',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.elements.user-label',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.show-limit',
		'tasks.v2.lib.user-selector-dialog',
		'tasks.v2.provider.service.user-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.menu.vue',
		'ui.vue3.components.popup',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => true,
];
