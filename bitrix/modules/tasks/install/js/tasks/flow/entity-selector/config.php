<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/entity-selector.bundle.css',
	'js' => 'dist/entity-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.entity-selector',
		'ui.info-helper',
	],
	'skip_core' => false,
];
