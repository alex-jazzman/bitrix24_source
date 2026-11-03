<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/compact-active-call.bundle.css',
	'js' => 'dist/compact-active-call.bundle.js',
	'rel' => [
		'im.v2.component.elements.avatar',
		'im.v2.const',
		'main.core',
		'ui.vue3',
	],
	'skip_core' => false,
];
