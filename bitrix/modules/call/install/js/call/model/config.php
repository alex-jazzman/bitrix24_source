<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-model.bundle.css',
	'js' => 'dist/call-model.bundle.js',
	'rel' => [
		'ui.vue',
		'main.core',
		'ui.vue.vuex',
		'call.const',
	],
	'skip_core' => false,
];
