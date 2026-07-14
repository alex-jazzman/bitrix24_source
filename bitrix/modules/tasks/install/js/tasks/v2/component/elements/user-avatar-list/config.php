<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-avatar-list.bundle.css',
	'js' => 'dist/user-avatar-list.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.elements.user-avatar',
		'tasks.v2.component.elements.user-label',
		'tasks.v2.provider.service.user-service',
		'ui.tooltip',
		'ui.vue3.components.popup',
	],
	'skip_core' => true,
];
