<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/scrum-manager.bundle.css',
	'js' => 'dist/scrum-manager.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
