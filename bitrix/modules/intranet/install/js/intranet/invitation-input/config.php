<?php

use Bitrix\Intranet\Internal\Integration\Socialnetwork\FeatureProvider;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$controllerMessages = IncludeModuleLangFile(
	Loader::getDocumentRoot() . '/bitrix/modules/intranet/lib/controller/invite.php',
	Loc::getCurrentLang(),
	true,
);
$invalidResponseMessage = $controllerMessages['INTRANET_CONTROLLER_INVITE_ERROR_INVALID_RESPONSE'] ?? '';

return [
	'css' => 'dist/invitation-input.bundle.css',
	'js' => 'dist/invitation-input.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'phone_number',
		'ui.entity-selector',
	],
	'skip_core' => false,
	'lang_additional' => [
		'INTRANET_CONTROLLER_INVITE_ERROR_INVALID_RESPONSE' => $invalidResponseMessage,
	],
	'settings' => [
		'isNewProjectsAvailable' => (new FeatureProvider())->isNewProjectsAvailable(),
		'isInvitationByPhoneAvailable' => (
			Loader::includeModule("bitrix24")
			&& Option::get('bitrix24', 'phone_invite_allowed', 'N') === 'Y'
		),
	],
];
