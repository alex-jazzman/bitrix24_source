<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/drop-zone.bundle.css',
	'js' => 'dist/drop-zone.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.provider.service.file-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.uploader.core',
	],
	'skip_core' => false,
];
