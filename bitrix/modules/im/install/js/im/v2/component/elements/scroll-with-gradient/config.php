<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/scroll-with-gradient.bundle.css',
	'js' => 'dist/scroll-with-gradient.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.directives',
	],
	'skip_core' => true,
];
