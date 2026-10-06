<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/fields-vue.bundle.js',
	'rel' => [
		'bizproc.fields',
		'main.core',
		'ui.vue3',
	],
	'skip_core' => false,
];
