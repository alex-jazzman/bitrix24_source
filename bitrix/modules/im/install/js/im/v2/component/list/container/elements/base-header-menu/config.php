<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/base-header-menu.bundle.css',
	'js' => 'dist/base-header-menu.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.elements.menu',
	],
	'skip_core' => true,
];
