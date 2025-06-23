<?php

namespace Bitrix\Crm\Controller\RepeatSale;

use Bitrix\Crm\Controller\ErrorCode;
use Bitrix\Crm\RepeatSale\AgentsManager;
use Bitrix\Crm\RepeatSale\FlowController;
use Bitrix\Crm\RepeatSale\Queue\Controller\RepeatSaleQueueController;
use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\RepeatSale\Segment\SegmentItem;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Config\Option;

final class Flow extends Base
{
	// region actions
	public function enableAction(): bool
	{
		$availabilityChecker = Container::getInstance()->getRepeatSaleAvailabilityChecker();

		if (
			!$availabilityChecker->isAvailable()
			|| !$availabilityChecker->hasPermission()
			|| !Container::getInstance()->getUserPermissions()->repeatSale()->canEdit()
		)
		{
			$this->addError(ErrorCode::getAccessDeniedError());

			return false;
		}

		if (!$availabilityChecker->isEnablePending()) // flow was enabled on earlier
		{
			return false;
		}

		$this->cleanQueue();
		$this->deletePendingOption();
		$this->processSystemSegments();
		$this->addAgents();
		$this->saveFlowEnableDate();

		return true;
	}
	// endregion

	private function cleanQueue(): void
	{
		$controller = RepeatSaleQueueController::getInstance();
		$controller->deleteOnlyCalcItems();
	}

	private function deletePendingOption(): void
	{
		$availabilityChecker = Container::getInstance()->getRepeatSaleAvailabilityChecker();

		Option::delete('crm', ['name' => $availabilityChecker::ENABLE_PENDING_OPTION_NAME]);
	}

	private function processSystemSegments(): void
	{
		$segmentController = RepeatSaleSegmentController::getInstance();
		$segments = $segmentController->getList([
			'select' => ['*', 'ASSIGNMENT_USERS.USER_ID'],
			'filter' => [
				'!=CODE' => null,
			],
			'limit' => 0,
		]);

		$userId = $this->getCurrentUser()?->getId() ?? 1;

		foreach ($segments as $segment)
		{
			$segmentItem = (SegmentItem::createFromEntity($segment))
				->setIsEnabled(true)
				->setClientCoverage(null)
			;

			if (empty($segmentItem->getAssignmentUserIds()))
			{
				$segmentItem->setAssignmentUserIds([$userId]);
			}

			$segmentController->update($segmentItem->getId(), $segmentItem);
		}
	}

	private function addAgents(): void
	{
		AgentsManager::getInstance()->addAgents();
	}

	private function saveFlowEnableDate(): void
	{
		FlowController::getInstance()->saveEnableDate();
	}
}
