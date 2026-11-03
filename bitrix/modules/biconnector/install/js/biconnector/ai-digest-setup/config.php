<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/ai-digest-setup.bundle.js',
    'rel' => [
		'main.core',
		'ui.banner-dispatcher',
	],
    'skip_core' => false,
];
