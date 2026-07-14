<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.copilot',
		'im.v2.lib.esc-manager',
		'im.v2.lib.feature',
		'im.v2.lib.permission',
		'im.v2.lib.text-highlighter',
		'main.core',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];
