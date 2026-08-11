<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/builder.bundle.css',
	'js' => 'dist/builder.bundle.js',
	'rel' => [
		'im.v2.component.animation',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.const',
		'im.v2.lib.feature',
		'im.v2.lib.parser',
		'main.core',
		'ui.icon-set.api.vue',
		'ui.lottie',
	],
	'skip_core' => false,
];
