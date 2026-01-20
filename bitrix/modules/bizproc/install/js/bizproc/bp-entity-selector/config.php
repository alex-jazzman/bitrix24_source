<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/bp-entity-selector.bundle.css',
	'js' => 'dist/bp-entity-selector.bundle.js',
	'rel' => [
		'main.core',
		'ui.entity-selector',
	],
	'skip_core' => false,
];
