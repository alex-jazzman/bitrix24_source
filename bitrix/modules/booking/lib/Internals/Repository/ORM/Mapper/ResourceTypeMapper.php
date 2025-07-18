<?php

declare(strict_types=1);

namespace Bitrix\Booking\Internals\Repository\ORM\Mapper;

use Bitrix\Booking\Entity\ResourceType\ResourceType;
use Bitrix\Booking\Internals\Model\EO_ResourceType;
use Bitrix\Booking\Internals\Model\ResourceTypeTable;

class ResourceTypeMapper
{
	public function convertFromOrm(EO_ResourceType $ormType): ResourceType
	{
		$type = new ResourceType();

		$type
			->setId($ormType->getId())
			->setName($ormType->getName())
			->setModuleId($ormType->getModuleId())
			->setCode($ormType->getCode())
		;

		$ormNotificationSettings = $ormType->getNotificationSettings();
		if ($ormNotificationSettings)
		{
			$type
				->setIsInfoNotificationOn($ormNotificationSettings->getIsInfoOn())
				->setTemplateTypeInfo($ormNotificationSettings->getTemplateTypeInfo())
				->setInfoNotificationDelay($ormNotificationSettings->getInfoDelay())
				->setIsConfirmationNotificationOn($ormNotificationSettings->getIsConfirmationOn())
				->setTemplateTypeConfirmation($ormNotificationSettings->getTemplateTypeConfirmation())
				->setConfirmationNotificationDelay($ormNotificationSettings->getConfirmationDelay())
				->setConfirmationNotificationRepetitions($ormNotificationSettings->getConfirmationRepetitions())
				->setConfirmationNotificationRepetitionsInterval($ormNotificationSettings->getConfirmationRepetitionsInterval())
				->setConfirmationCounterDelay($ormNotificationSettings->getConfirmationCounterDelay())
				->setIsReminderNotificationOn($ormNotificationSettings->getIsReminderOn())
				->setTemplateTypeReminder($ormNotificationSettings->getTemplateTypeReminder())
				->setReminderNotificationDelay($ormNotificationSettings->getReminderDelay())
				->setIsFeedbackNotificationOn($ormNotificationSettings->getIsFeedbackOn())
				->setTemplateTypeFeedback($ormNotificationSettings->getTemplateTypeFeedback())
				->setIsDelayedNotificationOn($ormNotificationSettings->getIsDelayedOn())
				->setTemplateTypeDelayed($ormNotificationSettings->getTemplateTypeDelayed())
				->setDelayedNotificationDelay($ormNotificationSettings->getDelayedDelay())
				->setDelayedCounterDelay($ormNotificationSettings->getDelayedCounterDelay())
			;
		}

		return $type;
	}

	public function convertToOrm(ResourceType $type): EO_ResourceType
	{
		$ormType = $type->getId()
			? EO_ResourceType::wakeUp($type->getId())
			: ResourceTypeTable::createObject()
		;

		$ormType
			->setName($type->getName())
			->setModuleId($type->getModuleId())
			->setCode($type->getCode())
		;

		return $ormType;
	}
}
