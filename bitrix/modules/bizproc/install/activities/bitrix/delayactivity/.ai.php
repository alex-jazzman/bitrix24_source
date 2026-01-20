<?php

use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingOption;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingOptionCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiDelayActivity implements IBPActivityAiDescription
{
	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new SettingCollection())
			->add(
				new Setting(
					name: 'TimeoutDuration',
					description: 'Duration of delay in seconds/days/hours/minutes',
					type: FieldType::INT,
				)
			)
			->add(
				new Setting(
					name: 'TimeoutDurationType',
					description: 'Duration of delay unit',
					type: FieldType::SELECT,
					options: (new SettingOptionCollection())
						->add(new SettingOption(id: 's', name: 'second'))
						->add(new SettingOption(id: 'm', name: 'minute'))
						->add(new SettingOption(id: 'h', name: 'hour'))
						->add(new SettingOption(id: 'd', name: 'day'))
				)
			)
			->add(
				new Setting(
					name: 'TimeoutTime',
					description: 'Delay until date, applies only if no TimeoutDuration set',
					type: FieldType::DATETIME,
				)
			)
			->add(
				new Setting(
					name: 'TimeoutTimeIsLocal',
					description: 'Y/N is process using user timezone for TimeoutTime, applies only if no TimeoutDuration set',
					type: FieldType::BOOL,
				)
			)
			->add(
				new Setting(
					name: 'WriteToLog',
					description: 'Y/N is need to save to workflow log delay info',
					type: FieldType::BOOL,
				)
			)
		;
	}
}