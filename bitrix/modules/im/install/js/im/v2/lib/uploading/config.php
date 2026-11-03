<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/uploading.bundle.js',
    'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.utils',
		'im.v2.provider.service.uploading',
		'main.core',
		'ui.uploader.core',
	],
    'skip_core' => false,
];
