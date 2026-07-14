<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/group.bundle.css',
	'js' => 'dist/group.bundle.js',
	'rel' => [
		'im.public',
		'main.core',
		'main.core.events',
		'tasks.v2.component.elements.field-add',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.color',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.scrum-manager',
		'tasks.v2.lib.show-limit',
		'tasks.v2.provider.service.group-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.provider.service.user-service',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.outline',
		'ui.notification-manager',
		'ui.system.chip.vue',
		'ui.system.menu.vue',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];
