<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.const',
		'im.v2.lib.channel',
		'im.v2.lib.copilot',
		'im.v2.lib.feature',
		'im.v2.lib.utils',
		'main.core',
		'ui.avatar',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];
