<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/menu.bundle.js',
	'rel' => [
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.lib.menu',
		'im.v2.lib.utils',
		'main.core',
	],
	'skip_core' => false,
];
