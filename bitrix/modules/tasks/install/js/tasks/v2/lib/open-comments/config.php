<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/open-comments.bundle.css',
	'js' => 'dist/open-comments.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.lib.side-panel-instance',
	],
	'skip_core' => true,
];
