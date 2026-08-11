<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/copilot-chat.bundle.js',
	'rel' => [
		'ai.copilot-chat.ui',
		'main.core',
		'main.core.events',
		'pull.client',
	],
	'skip_core' => false,
];
