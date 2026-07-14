<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/collab.bundle.css',
	'js' => 'dist/collab.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.theme',
		'main.core',
	],
	'skip_core' => false,
];
