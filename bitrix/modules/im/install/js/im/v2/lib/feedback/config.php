<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/feedback.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.lib.feature',
		'main.core',
	],
	'skip_core' => false,
];
