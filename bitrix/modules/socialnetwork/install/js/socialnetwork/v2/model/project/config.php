<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/project.bundle.css',
	'js' => 'dist/project.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'socialnetwork.v2.const',
		'ui.vue3.pinia',
	],
	'skip_core' => true,
];
