<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/apache-superset-dashboard-skeleton.bundle.css',
	'js' => 'dist/apache-superset-dashboard-skeleton.bundle.js',
	'rel' => [
		'main.core',
		'ui.lottie',
	],
	'skip_core' => false,
];
