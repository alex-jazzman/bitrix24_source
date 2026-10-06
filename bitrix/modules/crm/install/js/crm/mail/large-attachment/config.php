<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/large-attachment.bundle.js',
    'css' => './dist/large-attachment.bundle.css',
    'rel' => [
		'mail.client.large-attachment',
		'main.core',
		'ui.alerts',
	],
    'skip_core' => false,
];
