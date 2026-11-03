<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/onboarding-banners.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.core',
	],
	'skip_core' => false,
];
