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
		'crm.copilot.call-assessment-v2',
		'crm.router',
		'main.core',
		'pull.client',
		'ui.bbcode.formatter.html-formatter',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.notification',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
