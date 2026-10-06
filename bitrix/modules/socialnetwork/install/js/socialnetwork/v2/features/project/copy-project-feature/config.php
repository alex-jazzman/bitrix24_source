<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copy-project-feature.bundle.css',
	'js' => 'dist/copy-project-feature.bundle.js',
	'rel' => [
		'main.core',
		'socialnetwork.v2.const',
		'socialnetwork.v2.model.interface',
		'socialnetwork.v2.model.project',
		'socialnetwork.v2.provider.services.project-service',
		'ui.notification-manager',
	],
	'skip_core' => false,
];
