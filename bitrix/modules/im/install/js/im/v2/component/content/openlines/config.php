<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/openlines-content.bundle.css',
	'js' => 'dist/openlines-content.bundle.js',
	'rel' => [
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];