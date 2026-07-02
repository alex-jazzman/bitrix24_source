<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-assessment-selector.bundle.css',
	'js' => 'dist/call-assessment-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'pull.client',
		'ui.design-tokens',
		'ui.entity-selector',
	],
	'skip_core' => false,
];
