<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sku-resources-editor.bundle.css',
	'js' => 'dist/sku-resources-editor.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3',
		'ui.vue3.vuex',
		'booking.const',
	],
	'skip_core' => false,
];
