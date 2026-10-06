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
// GROUP_CODE and installs nothing while those roles do not exist yet. The agent is effectively one-shot
// (run() ignores the reschedule return value of install()), so a premature first run would leave the
// permissions uninstalled with no retry. Keep the original first-run delay so CRM can create the roles
// first — the migration agent helper cannot express next_exec.
\CAgent::AddAgent(
	name: '\\Bitrix\\Sign\\Agent\\Permission\\ReinstallAccessPermissionsAgent::run();',
	module: 'sign',
	interval: 60,
	next_exec: \ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 960, 'FULL'),
	existError: false,
);
