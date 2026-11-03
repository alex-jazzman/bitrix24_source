<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/group-service.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.const',
		'tasks.v2.lib.api-client',
		'tasks.v2.model.groups',
	],
	'skip_core' => false,
];
