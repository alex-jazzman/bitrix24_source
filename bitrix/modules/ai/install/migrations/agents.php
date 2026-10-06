<?php
$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

/** @see \Bitrix\AI\QueueJob::clearOldAgent */
$agent->add('Bitrix\AI\QueueJob::clearOldAgent();', 120, false);
/** @see \Bitrix\AI\Updater::refreshDbAgent */
$agent->add('Bitrix\AI\Updater::refreshDbAgent();', 3600, false);
// PropertiesSync: legacy-вызов без period/interval → core-дефолты CAgent::AddAgent (isPeriod=false, interval=86400); поведение сохранено (подтверждено verify-харнессом).
/** @see \Bitrix\AI\Cloud\Agent\PropertiesSync::retrieveModelsAgent */
$agent->add('Bitrix\\AI\\Cloud\\Agent\\PropertiesSync::retrieveModelsAgent();', 86400, false);

$isCloud = defined('BX24_HOST_NAME') && BX24_HOST_NAME !== '';

if ($isCloud)
{
	// Explicit execDelay keeps the first run at the same moment the previous installer set it:
	// enforceEngineBaseline runs once (returns an empty name) and does nothing outside the ru/by
	// zones, so an earlier run risks a silent no-op before the portal's zone is known.
	/** @see \Bitrix\AI\Agents\EngineSettings::resetToBitrixAudioInCloudAgent */
	$agent->add('Bitrix\AI\Agents\EngineSettings::resetToBitrixAudioInCloudAgent();', 3600, false, 600);
	/** @see \Bitrix\AI\Agents\EngineSettings::resetToBitrixGPTInCloudAgent */
	$agent->add('Bitrix\AI\Agents\EngineSettings::resetToBitrixGPTInCloudAgent();', 3600, false, 600);
	/** @see \Bitrix\AI\Agents\EngineSettings::enforceEngineBaselineAgent */
	$agent->add('Bitrix\AI\Agents\EngineSettings::enforceEngineBaselineAgent();', 3600, false, 3600);
}
else
{
	/** @see \Bitrix\AI\Agents\EngineSettings::resetFollowUpTextStepsToBGPTAgent */
	$agent->add('Bitrix\AI\Agents\EngineSettings::resetFollowUpTextStepsToBGPTAgent();', 3600, false, 600);
	/** @see \Bitrix\AI\Agents\EngineSettings::resetFlowsToBGPTAgent */
	$agent->add('Bitrix\AI\Agents\EngineSettings::resetFlowsToBGPTAgent();', 3600, false, 600);
}
