<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/compact-active-call-list.bundle.css',
	'js' => 'dist/compact-active-call-list.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.compact-active-call',
	],
	'skip_core' => true,
];
