<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/guest-invitation.bundle.js',
    'css' => './dist/guest-invitation.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.rest',
	],
    'skip_core' => true,
];
