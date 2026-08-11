<?php

use Bitrix\Intranet\Internal\Integration\Socialnetwork\FeatureProvider;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/invitation-input.bundle.css',
	'js' => 'dist/invitation-input.bundle.js',
	'rel' => [
		'main.core',
		'main.core.cache',
		'main.core.events',
		'phone_number',
		'ui.entity-selector',
	],
	'skip_core' => false,
	'settings' => [
		'isNewProjectsAvailable' => (new FeatureProvider())->isNewProjectsAvailable(),
		'isInvitationByPhoneAvailable' => (
			Loader::includeModule("bitrix24")
			&& Option::get('bitrix24', 'phone_invite_allowed', 'N') === 'Y'
		),
	],
];
