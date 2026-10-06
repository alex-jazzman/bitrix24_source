<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Bitrix\Socialnetwork\Helper\Feature;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

if (!Loader::includeModule('socialnetwork'))
{
    return [];
}

$copilotName = 'BitrixGPT';
if (Loader::includeModule('ui'))
{
    $copilotName = (new CopilotNameService())->getCopilotName();
}

$isChinaZone = Application::getInstance()->getLicense()->getRegion() === 'cn';

return [
    'js' => './dist/projects-trial-banner.bundle.js',
    'css' => './dist/projects-trial-banner.bundle.css',
    'rel' => [
		'main.core',
		'main.date',
		'socialnetwork.v2.components.elements.ui-popup',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.rich-loc',
	],
    'skip_core' => false,
    'settings' => [
        'assetsPath' => '/bitrix/js/socialnetwork/v2/components/popup/projects-trial-banner',
        'trialDays' => Feature::PROJECTS_TRIAL_DAYS,
        'copilotName' => $copilotName,
        'isChinaZone' => $isChinaZone,
    ],
];
