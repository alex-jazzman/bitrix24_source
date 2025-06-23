<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/files.bundle.css',
	'js' => 'dist/files.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.vuex',
		'ui.icon-set.api.vue',
		'tasks.v2.component.elements.bottom-sheet',
		'ui.uploader.core',
		'ui.icon-set.api.core',
		'ui.icon-set.animated',
		'ui.icon-set.outline',
		'tasks.v2.component.elements.chip',
		'tasks.v2.const',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.analytics',
		'ui.vue3.components.popup',
		'ui.vue3.components.button',
		'disk.uploader.user-field-widget',
		'tasks.v2.provider.service.file-service',
	],
	'skip_core' => false,
];
