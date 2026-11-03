<?php
declare(strict_types=1);

use Bitrix\Disk\Internal\Enum\ExternalLinkDisableReason;
use Bitrix\Disk\Internal\Enum\MembersAccessDisableReason;
use Bitrix\Disk\Internal\Enum\SharingMemberType;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/sharing-popup.bundle.js',
    'css' => './dist/sharing-popup.bundle.css',
	'rel' => [
		'main.core',
		'main.date',
		'main.loader',
		'main.popup',
		'ui.date-picker',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.notification-panel',
		'ui.system.dialog',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
	],
    'skip_core' => false,
	'settings' => [
		'limitSliders' => [
			'membersAccessFileTariff' => 'limit_office_files_access_permissions',
			'externalLinkFileTariff' => 'limit_office_share_file',
		],
		'membersAccessDisableReasons' => MembersAccessDisableReason::forExtension(),
		'externalLinkDisableReasons' => ExternalLinkDisableReason::forExtension(),
		'memberTypes' => SharingMemberType::forExtension(),
	],
];
