<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'crm.copilot.call-assessment-selector',
		'crm.router',
		'im.v2.lib.desktop-api',
		'im.v2.lib.phone',
		'main.core',
		'pull.client',
		'ui.bbcode.formatter.html-formatter',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.notification',
		'ui.vue',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
