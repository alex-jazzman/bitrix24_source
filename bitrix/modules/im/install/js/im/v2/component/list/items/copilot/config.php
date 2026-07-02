<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-list.bundle.css',
	'js' => 'dist/copilot-list.bundle.js',
	'rel' => [
		'im.v2.component.list.items.base',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.draft',
		'im.v2.lib.menu',
		'im.v2.provider.service.copilot',
		'main.core',
	],
	'skip_core' => false,
];