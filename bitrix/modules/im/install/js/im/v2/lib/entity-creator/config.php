<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/entity-creator.bundle.js',
	],
	'rel' => [
		'calendar.sliderloader',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.rest',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];