<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-label.bundle.css',
	'js' => 'dist/user-label.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.system.skeleton.vue',
		'ui.tooltip',
		'tasks.v2.component.elements.user-avatar',
	],
	'skip_core' => true,
];
