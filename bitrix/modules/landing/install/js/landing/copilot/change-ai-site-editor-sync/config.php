<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/change-ai-site-editor-sync.bundle.js',
	'rel' => [
		'landing.backend',
		'landing.copilot.generation-observer',
		'landing.env',
		'landing.history',
		'landing.main',
		'landing.pageobject',
		'landing.tailwind.runtimesync',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];
