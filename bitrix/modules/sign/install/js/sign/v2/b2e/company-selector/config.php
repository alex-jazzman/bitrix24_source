<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/company-selector.bundle.css',
	'js' => 'dist/company-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'main.loader',
		'main.popup',
		'sign.v2.api',
		'sign.v2.company-editor',
		'sign.v2.helper',
		'ui.entity-selector',
		'sign.tour',
		'ui.label',
		'ui.alerts',
	],
	'skip_core' => false,
];
