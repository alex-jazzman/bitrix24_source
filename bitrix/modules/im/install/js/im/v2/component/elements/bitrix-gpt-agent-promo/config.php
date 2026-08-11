<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/bitrix-gpt-agent-promo.bundle.css',
	'js' => 'dist/bitrix-gpt-agent-promo.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.promo',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.system.typography',
	],
	'skip_core' => false,
];
