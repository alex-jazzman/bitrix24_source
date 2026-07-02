<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/registry.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.layout',
		'im.v2.lib.logger',
		'im.v2.lib.message',
		'im.v2.lib.recent',
		'im.v2.lib.user',
		'im.v2.lib.user-status',
		'im.v2.lib.utils',
		'im.v2.model',
		'main.core',
		'main.core.events',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
