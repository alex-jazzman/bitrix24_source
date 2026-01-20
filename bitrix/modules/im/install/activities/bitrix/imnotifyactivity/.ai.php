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

class CBPAiImNotifyActivity implements IBPActivityAiDescription
{
	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new SettingCollection())
			->add(
				new Setting(
					name: 'MessageUserFrom',
					description: 'Notification sender user',
					type: \Bitrix\Bizproc\BaseType\User::getAiSettingType(),
					required: true,
				)
			)
			->add(
				new Setting(
					name: 'MessageUserTo',
					description: 'Notification receiver user or group of users',
					type: \Bitrix\Bizproc\BaseType\User::getAiSettingType(),
					required: true,
					multiple: true,
				)
			)
			->add(
				new Setting(
					name: 'MessageSite',
					description: 'Notification message text, bitrix messenger BB codes are allowed to use',
					type: FieldType::STRING,
					required: true,
				)
			)
			->add(
				new Setting(
					name: 'MessageOut',
					description: 'Additional notification message text used only then notification is delivered by email, MessageSite used for email notification if not present',
					type: FieldType::STRING,
				)
			)
			->add(
				new Setting(
					name: 'MessageType',
					description: 'Type of message',
					type: FieldType::SELECT,
					required: true,
					options: (new SettingOptionCollection())
						->add(
							new SettingOption(
								id: '2',
								name: 'Personalized notification with avatar of sender user',
							)
						)
						->add(
							new SettingOption(
								id: '4',
								name: 'System notification without avatar of sender user',
							)
						)
				)
			)
		;
	}
}