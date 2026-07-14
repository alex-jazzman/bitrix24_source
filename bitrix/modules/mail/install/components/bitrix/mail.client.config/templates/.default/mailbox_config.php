<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var CAllMain $APPLICATION */

use Bitrix\Mail\Helper\LicenseManager;
use Bitrix\Mail\Helper\MailAccess;
use Bitrix\Mail\Helper\Mailbox\MailboxSettingsConfig;
use Bitrix\Mail\Helper\OrphanedMailboxLifecycle;
use Bitrix\Main\Config\Option;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

Extension::load('mail.connecting.config-form');

$bodyClass = trim((string)$APPLICATION->GetPageProperty('BodyClass'));
$APPLICATION->SetPageProperty(
	'BodyClass',
	trim($bodyClass . ' no-all-paddings no-background --ui-context-content-light'),
);

$mailbox = is_array($arParams['MAILBOX'] ?? null) ? $arParams['MAILBOX'] : [];
$service = is_array($arParams['SERVICE'] ?? null) ? $arParams['SERVICE'] : [];
$isNew = empty($mailbox);
$canEditCrm = !empty($arParams['CRM_AVAILABLE']) && !empty($arParams['HAS_ACCESS_TO_EDIT_CRM']);
$sharedMailboxLimit = LicenseManager::getSharedMailboxesLimit();

$normalizeOptions = static function(array $options): array
{
	$result = [];

	foreach ($options as $value => $label)
	{
		$result[] = [
			'value' => (string)$value,
			'label' => (string)$label,
		];
	}

	return $result;
};

$normalizeService = static function(array $serviceData): ?array
{
	if (empty($serviceData))
	{
		return null;
	}

	$result = [
		'id' => isset($serviceData['id']) ? (int)$serviceData['id'] : null,
		'type' => $serviceData['type'] ?? null,
		'name' => $serviceData['name'] ?? null,
		'link' => $serviceData['link'] ?? null,
		'icon' => $serviceData['icon'] ?? null,
		'server' => $serviceData['server'] ?? null,
		'port' => $serviceData['port'] ?? null,
		'encryption' => $serviceData['encryption'] ?? null,
		'upload_outgoing' => ($serviceData['upload_outgoing'] ?? 'N') === 'Y',
		'oauth' => !empty($serviceData['oauth']),
		'oauth_smtp_enabled' => !empty($serviceData['oauth_smtp_enabled']),
	];

	if (!empty($serviceData['smtp']) && is_array($serviceData['smtp']))
	{
		$result['smtp'] = [
			'server' => $serviceData['smtp']['server'] ?? '',
			'port' => $serviceData['smtp']['port'] ?? '',
			'login' => !empty($serviceData['smtp']['login']),
			'password' => !empty($serviceData['smtp']['password']),
		];
	}

	return $result;
};

$settingsConfig = MailboxSettingsConfig::getConfig();
$defaultSettings = is_array($settingsConfig['defaults'] ?? null) ? $settingsConfig['defaults'] : [];
$defaultMaxAgeMessageSync = (int)($defaultSettings['messageMaxAge'] ?? 7);
$defaultMaxCrmSync = (int)($defaultSettings['crmSyncPeriod'] ?? 7);
$mailSyncIntervals = [];
$crmSyncIntervals = [];

if ($isNew)
{
	$maxAgeLimit = LicenseManager::getSyncOldLimit();

	if ($maxAgeLimit > 0 && $maxAgeLimit < 7)
	{
		$defaultMaxAgeMessageSync = 1;
	}

	foreach (($settingsConfig['mailSyncIntervals'] ?? []) as $item)
	{
		$value = (int)($item['value'] ?? 0);
		if ($maxAgeLimit <= 0 || $value <= $maxAgeLimit)
		{
			$mailSyncIntervals[(string)$value] = (string)($item['label'] ?? '');
		}
	}

	if ($maxAgeLimit <= 0)
	{
		$mailSyncIntervals['-1'] = Loc::getMessage('MAIL_CLIENT_CONFIG_IMAP_AGE_2_I') ?? '';
	}
}
else
{
	foreach (($settingsConfig['mailSyncIntervals'] ?? []) as $item)
	{
		$mailSyncIntervals[(string)($item['value'] ?? '')] = (string)($item['label'] ?? '');
	}
}

foreach (($settingsConfig['crmSyncIntervals'] ?? []) as $item)
{
	$crmSyncIntervals[(string)($item['value'] ?? '')] = (string)($item['label'] ?? '');
}

$initialData = [
	'mode' => $isNew ? 'create' : 'edit',
	'mailboxId' => $isNew ? null : (int)$mailbox['ID'],
	'service' => $normalizeService($service),
	'settingsConfig' => [
		'mailSyncIntervals' => $normalizeOptions($mailSyncIntervals),
		'crmSyncIntervals' => $normalizeOptions($crmSyncIntervals),
		'crmEntities' => $normalizeOptions((array)($arParams['NEW_ENTITY_LIST'] ?? [])),
		'crmSources' => $normalizeOptions((array)($arParams['LEAD_SOURCE_LIST'] ?? [])),
		'defaultCrmSource' => (string)($arParams['DEFAULT_LEAD_SOURCE'] ?? ($defaultSettings['crmSource'] ?? '')),
		'defaults' => array_merge(
			$defaultSettings,
			[
				'messageMaxAge' => $defaultMaxAgeMessageSync,
				'crmSyncPeriod' => $defaultMaxCrmSync,
				'crmSource' => (string)($arParams['DEFAULT_LEAD_SOURCE'] ?? ($defaultSettings['crmSource'] ?? '')),
				'crmIncomingEntity' => (string)($arParams['DEFAULT_NEW_ENTITY_IN'] ?? ($defaultSettings['crmIncomingEntity'] ?? '')),
				'crmOutgoingEntity' => (string)($arParams['DEFAULT_NEW_ENTITY_OUT'] ?? ($defaultSettings['crmOutgoingEntity'] ?? '')),
			],
		),
		'crmAvailable' => !empty($arParams['CRM_AVAILABLE']),
		'canEditCrmIntegration' => $canEditCrm,
	],
	'paths' => [
		'messageList' => $arParams['PATH_TO_MAIL_MSG_LIST'] ?? '',
		'home' => $arParams['PATH_TO_MAIL_HOME'] ?? '',
		'configDirs' => $arParams['PATH_TO_MAIL_CONFIG_DIRS'] ?? '/mail/config/dirs',
	],
	'permissions' => [
		'canEditCrm' => $canEditCrm,
		'canEditAccess' => $isNew || empty($arParams['HAS_NO_ACCESS_TO_SHARE_MAILBOX']),
		'canChangeOwner' => !$isNew
			&& Option::get('mail', 'enable_mailbox_owner_change', 'N') === 'Y'
			&& MailAccess::hasCurrentUserAdminAccess()
			&& OrphanedMailboxLifecycle::isOrphan($mailbox),
		'isSmtpAvailable' => !empty($arParams['IS_SMTP_AVAILABLE']),
		'isCrmAvailable' => !empty($arParams['CRM_AVAILABLE']),
		'isCalendarAvailable' => !empty($arParams['IS_CALENDAR_AVAILABLE']),
		'syncOldLimit' => LicenseManager::getSyncOldLimit(),
		'sharedMailboxLimit' => $sharedMailboxLimit,
		'sharedMailboxLimitReached' => !empty($arResult['FORBIDDEN_TO_SHARE_MAILBOX']),
		'sharedMailboxesCount' => (int)($arResult['SHARED_MAILBOXES_COUNT'] ?? 0),
	],
];

$initialData = Json::encode($initialData);
?>

<div id="mail-mailbox-config-container"></div>

<script>
	BX.ready(function() {
		var initialData = <?= $initialData ?>;
		var form = new BX.Mail.Connecting.ConfigForm.MailboxConfigForm({
			containerId: 'mail-mailbox-config-container',
			initialData: initialData,
		});
		form.start();
	});
</script>
