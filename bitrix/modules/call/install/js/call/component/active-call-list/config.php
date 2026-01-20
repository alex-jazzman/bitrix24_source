<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/active-call-list.bundle.css',
	'js' => 'dist/active-call-list.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.active-call',
	],
	'skip_core' => true,
];