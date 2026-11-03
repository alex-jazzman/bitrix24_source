<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/message-view.bundle.js',
	'css' => './dist/message-view.bundle.css',
	'rel' => [
		'main.core',
		'ui.vue3',
	],
	'skip_core' => false,
];
