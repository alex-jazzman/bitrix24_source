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
		'main.core.events',
		'im.v2.lib.layout',
		'im.v2.lib.user',
		'im.v2.lib.user-status',
		'im.v2.lib.logger',
		'im.v2.lib.channel',
		'im.v2.lib.utils',
		'im.v2.application.core',
		'ui.vue3.vuex',
		'im.v2.model',
		'im.v2.const',
		'main.core',
	],
	'skip_core' => false,
];
