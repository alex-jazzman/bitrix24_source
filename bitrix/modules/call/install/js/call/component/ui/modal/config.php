<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => './dist/modal.bundle.css',
	'js' => './dist/modal.bundle.js',
	'rel' => [
		'call.component.ui.icon',
		'main.core',
		'ui.vue3',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];
