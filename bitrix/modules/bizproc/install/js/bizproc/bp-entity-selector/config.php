<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/bp-entity-selector.bundle.css',
	'js' => 'dist/bp-entity-selector.bundle.js',
	'rel' => [
		'ui.entity-selector',
		'main.core',
	],
	'skip_core' => false,
];
