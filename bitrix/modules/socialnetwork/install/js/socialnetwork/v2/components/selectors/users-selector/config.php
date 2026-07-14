<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/users-selector.bundle.css',
	'js' => 'dist/users-selector.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'socialnetwork.v2.const',
		'ui.entity-selector',
	],
	'skip_core' => true,
];
