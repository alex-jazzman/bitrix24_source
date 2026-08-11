<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-model.bundle.css',
	'js' => 'dist/call-model.bundle.js',
	'rel' => [
		'call.const',
		'main.core',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];
