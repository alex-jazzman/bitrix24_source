<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Extension;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Tasks\Helper\Analytics;
use Bitrix\Tasks\V2\FormV2Feature;
use Bitrix\Tasks\V2\Internals\Container;

class Config
{
	public function getCoreSettings(): array
	{
		$currentUserId = (int)CurrentUser::get()->getId();

		$tariffService = Container::getInstance()->getTariffService();

		$analyticsHelper = Analytics::getInstance($currentUserId);

		$editPath = Container::getInstance()->getLinkService()->getCreateTask($currentUserId);

		return [
			'currentUserId' => $currentUserId,
			'limits' => [
				'mailUserIntegration' => $tariffService->isMailUserAvailable(),
				'mailUserIntegrationFeatureId' => $tariffService->getMailUserFeature(),
				'project' => $tariffService->isProjectAvailable(),
				'projectFeatureId' => $tariffService->getProjectFeatureId(),
				'stakeholders' => $tariffService->isStakeholderAvailable(),
			],
			'defaultDeadline' => Container::getInstance()->getDeadlineRepository()->getByUserId($currentUserId)->toArray(),
			'chatType' => \Bitrix\Tasks\V2\Internals\Integration\Im\Chat::ENTITY_TYPE,
			'features' => [
				'isV2Enabled' => FormV2Feature::isOn(),
				'isMiniformEnabled' => FormV2Feature::isOn('miniform'),
			],
			'paths' => [
				'editPath' => $editPath,
			],
			'analytics' => [
				'userType' => $analyticsHelper->getUserTypeParameter(),
			],
		];
	}
}
