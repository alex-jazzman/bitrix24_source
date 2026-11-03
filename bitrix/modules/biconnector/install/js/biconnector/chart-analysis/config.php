<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/chart-analysis.bundle.js',
	'css' => './dist/chart-analysis.bundle.css',
	'rel' => [
		'main.core',
		'pull.client',
		'ui.analytics',
		'ui.notification',
	],
	'skip_core' => false,
];
