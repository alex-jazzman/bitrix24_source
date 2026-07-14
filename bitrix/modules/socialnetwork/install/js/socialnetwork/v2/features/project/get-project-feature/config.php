<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/get-project-feature.bundle.css',
	'js' => 'dist/get-project-feature.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'socialnetwork.v2.model.project',
		'socialnetwork.v2.provider.services.project-service',
	],
	'skip_core' => true,
];
