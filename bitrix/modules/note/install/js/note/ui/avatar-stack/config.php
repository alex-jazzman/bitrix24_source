<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/avatar-stack.bundle.js',
	'css' => './dist/avatar-stack.bundle.css',
	'rel' => [
		'main.core',
		'ui.hint',
		'ui.icon-set.outline',
		'ui.vue3.components.avatar',
	],
	'skip_core' => false,
];
