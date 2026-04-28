<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/menu.bundle.js',
	'rel' => [
		'main.core',
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.lib.menu',
		'im.v2.lib.utils',
	],
	'skip_core' => false,
];
