<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$isPhoneInviteAvailable = Loader::includeModule("bitrix24") && Option::get('bitrix24', 'phone_invite_allowed', 'N') === 'Y';
$isInviteLinkAvailable = Loader::includeModule("bitrix24") && Option::get("socialservices", "new_user_registration_network", "N") === 'Y';

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.public',
		'im.v2.application.core',
		'im.v2.component.elements.button',
		'im.v2.component.elements.popup',
		'im.v2.component.elements.scroll-with-gradient',
		'im.v2.component.search',
		'im.v2.const',
		'im.v2.lib.access',
		'im.v2.lib.analytics',
		'im.v2.lib.channel',
		'im.v2.lib.collab',
		'im.v2.lib.confirm',
		'im.v2.lib.feature',
		'im.v2.lib.guest',
		'im.v2.lib.helpdesk',
		'im.v2.lib.layout',
		'im.v2.lib.local-storage',
		'im.v2.lib.notifier',
		'im.v2.lib.permission',
		'im.v2.lib.sound-notification',
		'im.v2.lib.utils',
		'im.v2.provider.service.chat',
		'im.v2.provider.service.collab-invitation',
		'im.v2.provider.service.guest-invitation',
		'im.v2.provider.service.sending',
		'intranet.invitation-input',
		'intranet.languages',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.info-helper',
		'ui.system.dialog',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
	],
	'settings' => [
		'isPhoneInviteAvailable' => $isPhoneInviteAvailable,
		'isInviteLinkAvailable' => $isInviteLinkAvailable,
	],
	'skip_core' => false,
];
