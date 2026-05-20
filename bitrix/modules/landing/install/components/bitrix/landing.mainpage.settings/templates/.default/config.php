<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'script.js',
	'rel' => [
		'main.core',
		'landing.integration.intranet-setting.vibe-page',
	],
	'skip_core' => false,
];
