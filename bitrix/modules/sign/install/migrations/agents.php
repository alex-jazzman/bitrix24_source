<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

// No functional first-run delay: updater scripts 23.600.0 and 23.600.100 registered this agent without
// next_exec (interval only), so the installer's +60s offset was cosmetic. The helper is enough.
$agent->add('\\Bitrix\\Sign\\Service\\Providers\\LegalInfoProviderAgentService::installLegalConfig();', 3600, false);

// ConvertProviderSchemesAgent is a one-shot data migration (SES_RU DEFAULT -> ORDER, in batches). The
// +3600s first-run delay is applied consistently in both the installer and updater 24.800.0 to avoid
// running the heavy conversion right after install/update. Register directly to keep next_exec — the
// migration agent helper cannot express it.
\CAgent::AddAgent(
	'Bitrix\\Sign\\Agent\\Converter\\ConvertProviderSchemesAgent::run();',
	'sign',
	period: 'N',
	interval: 900,
	next_exec: \ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 3600, 'FULL'),
	existError: false,
);

// ReinstallAccessPermissionsAgent depends on CRM roles: AccessInstaller::install() reads CCrmRole by
// GROUP_CODE and installs nothing while those roles do not exist yet. A run that installed nothing asks
// for itself again, so a premature first run is retried instead of leaving the permissions uninstalled.
// Keep the original first-run delay all the same, so the usual course is CRM creating the roles before
// the first run rather than a run per interval until it does — the migration agent helper cannot
// express next_exec.
\CAgent::AddAgent(
	name: '\\Bitrix\\Sign\\Agent\\Permission\\ReinstallAccessPermissionsAgent::run();',
	module: 'sign',
	interval: 60,
	next_exec: \ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 960, 'FULL'),
	existError: false,
);

// Queue of the KEDO process launches (BRIEF-kedo-run-process-2026-08-25). The interval is one of the
// three values the waiting term of a group is derived from: it must stay equal to
// LaunchService::QUEUE_INTERVAL_SECONDS, which getWaitingTermSeconds() counts with. The constant itself
// is not referenced here - the class of the module is not autoloadable while the module is being
// installed. No first-run delay is needed: an empty queue costs the agent two indexed selects.
$agent->add([\Bitrix\Sign\Agent\Process\LaunchQueueAgent::class, 'run'], 60, false);
