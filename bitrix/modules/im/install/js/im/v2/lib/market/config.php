<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/market.bundle.js',
	],
	'rel' => [
		'ui.vue3.vuex',
		'im.v2.lib.logger',
		'main.core',
		'im.public',
		'im.v2.application.core',
		'im.v2.const',
	],
	'skip_core' => false,
];
