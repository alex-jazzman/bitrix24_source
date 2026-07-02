<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/promotion.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.popup',
		'main.ajax',
		'ui.promo-video-popup',
		'ai.copilot-promo-popup',
		'tasks.v2.lib.aha-moments',
		'tasks.v2.const',
	],
	'skip_core' => true,
];

