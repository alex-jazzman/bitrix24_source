<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/file-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'ui.uploader.core',
		'ui.uploader.vue',
		'disk.uploader.user-field-widget',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.api-client',
		'tasks.v2.provider.service.task-service',
	],
	'skip_core' => true,
];
