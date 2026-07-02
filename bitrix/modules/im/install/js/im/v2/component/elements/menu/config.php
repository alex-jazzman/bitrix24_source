<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.elements.popup',
		'im.v2.lib.counter',
		'im.v2.lib.utils',
	],
	'skip_core' => true,
];
