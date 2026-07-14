<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/collab-creation.bundle.css',
	'js' => 'dist/collab-creation.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.message.base',
		'im.v2.lib.feature',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
	'skip_core' => true,
];
