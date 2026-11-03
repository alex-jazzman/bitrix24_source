<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/voice-recorder.bundle.js',
    'rel' => [
		'im.v2.application.core',
		'im.v2.lib.analytics',
		'im.v2.provider.service.uploading',
		'main.core',
		'main.core.events',
	],
    'skip_core' => false,
];
