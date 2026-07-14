<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tags-selector.bundle.css',
	'js' => 'dist/tags-selector.bundle.js',
	'rel' => [
		'main.core',
		'socialnetwork.v2.const',
		'ui.entity-selector',
	],
	'skip_core' => false,
];
