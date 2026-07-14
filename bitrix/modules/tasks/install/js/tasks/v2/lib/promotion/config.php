<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/promotion.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ai.copilot-promo-popup',
		'main.ajax',
		'main.popup',
		'tasks.v2.const',
		'tasks.v2.lib.aha-moments',
		'ui.promo-video-popup',
	],
	'skip_core' => true,
];

