<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/mailbox-crm-mass.bundle.js',
    'css' => './dist/mailbox-crm-mass.bundle.css',
    'rel' => [
		'mail.connecting.crm-integration',
		'mail.connecting.settings-config',
		'main.core',
		'ui.dialogs.messagebox',
		'ui.vue3',
	],
    'skip_core' => false,
];
