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
		'call.widget.active-call',
		'call.widget.sync-active-calls-slot',
	],
	'skip_core' => true,
];
