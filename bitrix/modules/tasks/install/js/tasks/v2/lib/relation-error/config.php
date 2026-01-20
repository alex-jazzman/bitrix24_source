<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/relation-error.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.core',
		'tasks.v2.const',
		'tasks.v2.lib.hint',
	],
	'skip_core' => true,
];
