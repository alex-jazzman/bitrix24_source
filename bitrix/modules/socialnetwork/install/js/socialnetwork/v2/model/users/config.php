<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/users.bundle.css',
	'js' => 'dist/users.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
