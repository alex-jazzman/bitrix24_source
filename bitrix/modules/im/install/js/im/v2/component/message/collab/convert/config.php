<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/convert.bundle.css',
	'js' => 'dist/convert.bundle.js',
	'rel' => [
		'im.v2.component.message.base',
		'im.v2.lib.copilot',
		'im.v2.lib.feature',
		'main.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
