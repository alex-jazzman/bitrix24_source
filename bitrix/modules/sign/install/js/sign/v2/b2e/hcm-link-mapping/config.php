<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/hcm-link-mapping.bundle.css',
	'js' => 'dist/hcm-link-mapping.bundle.js',
	'rel' => [
		'humanresources.hcmlink.data-mapper',
		'main.core',
		'main.core.events',
		'main.loader',
		'sign.v2.api',
		'ui.entity-selector',
	],
	'skip_core' => false,
];