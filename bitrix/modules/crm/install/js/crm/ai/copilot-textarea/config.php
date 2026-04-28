<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-textarea.bundle.css',
	'js' => 'dist/copilot-textarea.bundle.js',
	'rel' => [
		'ai.copilot',
		'crm.ai.name-service',
		'main.core.events',
		'main.popup',
		'main.core',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
