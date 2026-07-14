<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/add-task-button.bundle.css',
	'js' => 'dist/add-task-button.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.fields.user-fields',
		'tasks.v2.const',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.provider.service.file-service',
		'ui.dialogs.messagebox',
		'ui.vue3.components.button',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
