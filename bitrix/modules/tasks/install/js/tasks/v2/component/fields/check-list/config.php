<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/check-list.bundle.css',
	'js' => 'dist/check-list.bundle.js',
	'rel' => [
		'main.popup',
		'ui.entity-selector',
		'tasks.v2.core',
		'tasks.v2.lib.user-selector-dialog',
		'tasks.v2.provider.service.check-list-service',
		'tasks.v2.component.elements.participant-list',
		'ui.notification',
		'ui.icon-set.outline',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.component.elements.chip',
		'tasks.v2.component.elements.bottom-sheet',
		'ui.vue3.components.menu',
		'ui.uploader.core',
		'disk.uploader.user-field-widget',
		'tasks.v2.component.elements.growing-text-area',
		'tasks.v2.component.elements.user-avatar-list',
		'tasks.v2.provider.service.file-service',
		'tasks.v2.component.elements.hint',
		'main.core',
		'main.core.events',
		'ui.vue3.components.popup',
		'ui.vue3.vuex',
		'ui.vue3.components.button',
		'ui.icon-set.api.vue',
		'ui.icon-set.api.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
