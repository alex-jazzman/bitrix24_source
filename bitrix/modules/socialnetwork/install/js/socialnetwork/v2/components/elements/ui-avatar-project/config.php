<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-avatar-project.bundle.css',
	'js' => 'dist/ui-avatar-project.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.notification',
		'ui.uploader.core',
		'ui.vue3.components.avatar',
	],
	'skip_core' => true,
];
