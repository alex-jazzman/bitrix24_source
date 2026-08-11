<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/bitrixgpt-launcher.bundle.js',
    'css' => './dist/bitrixgpt-launcher.bundle.css',
    'rel' => [
		'intranet.ai-chat-panel',
		'main.core',
		'ui.notification',
	],
    'skip_core' => false,
];
