<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ai-assistant-router.bundle.css',
	'js' => 'dist/ai-assistant-router.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.list.container.copilot',
		'im.v2.lib.feature',
		'im.public',
		'im.v2.component.list.items.ai-assistant',
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.provider.service.ai-assistant',
		'im.v2.lib.permission',
	],
	'skip_core' => true,
];