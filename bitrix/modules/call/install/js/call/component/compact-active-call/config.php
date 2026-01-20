<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/compact-active-call.bundle.css',
	'js' => 'dist/compact-active-call.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.elements.avatar',
	],
	'skip_core' => true,
];
