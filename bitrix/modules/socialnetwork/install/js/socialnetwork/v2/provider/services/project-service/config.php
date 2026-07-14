<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/project-service.bundle.css',
	'js' => 'dist/project-service.bundle.js',
	'rel' => [
		'main.core',
		'socialnetwork.v2.const',
		'socialnetwork.v2.lib.api-client',
		'socialnetwork.v2.model.project',
	],
	'skip_core' => false,
];
