<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

global $USER;
// Vibe Code catalog is a portal-employee feature: hide it for im guests even when the
// connector is globally ready. 'im_guest' === \Bitrix\Im\V2\Entity\User\UserGuest::AUTH_ID
// (literal here to keep the extension config free of module-autoload assumptions).
$isGuest = is_object($USER) && $USER->GetParam('EXTERNAL_AUTH_ID') === 'im_guest';
$isConnectorReady = \Bitrix\Main\Config\Option::get('vibecodeconnector', 'is_ready', 'N') === 'Y';

return [
    'js' => './dist/vibe-code-catalog-button.bundle.js',
    'css' => './dist/vibe-code-catalog-button.bundle.css',
    'rel' => [
		'im.v2.const',
		'main.core',
		'main.core.events',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'settings' => [
		'isAvailable' => $isConnectorReady && !$isGuest,
	],
    'skip_core' => false,
];
