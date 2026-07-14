<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.public',
		'im.v2.component.elements.loader',
		'im.v2.component.list.items.copilot',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.copilot',
		'im.v2.lib.feature',
		'im.v2.lib.logger',
		'im.v2.lib.permission',
		'im.v2.provider.service.copilot',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];
