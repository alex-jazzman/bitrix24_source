<?php

namespace Bitrix\Crm\RepeatSale\Service\Action;

use Bitrix\Crm\Activity\Entity;
use Bitrix\Crm\Activity\Provider\RepeatSale;
use Bitrix\Crm\Item;
use Bitrix\Crm\ItemIdentifier;
use Bitrix\Crm\RepeatSale\Segment\SegmentItem;
use Bitrix\Crm\RepeatSale\Service\Context;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;
use Bitrix\Main\Type\DateTime;

class CreateActivityAction implements ActionInterface
{
	public function process(
		Item $clientItem,
		int $assignmentUserId,
		?Result $prevActionResult = null,
		?Context $context = null,
		?SegmentItem $segmentItem = null,
	): Result
	{
		if (!$prevActionResult?->isSuccess())
		{
			return $prevActionResult;
		}

		$item = $prevActionResult?->getData()['item'] ?? null;
		if ($item === null)
		{
			return $this->getErrorResult();
		}

		$activityId = $this->addActivity($item, $assignmentUserId, $context);
		if ($activityId === null)
		{
			return $this->getErrorResult();
		}

		return $prevActionResult;
	}

	private function getErrorResult(): Result
	{
		return (new Result())->addError(new Error(Loc::getMessage('CRM_REPEAT_SALE_ACTION_CREATE_ACTIVITY_ERROR')));
	}

	private function addActivity(Item $item, int $assignmentUserId, ?Context $context = null): ?int
	{
		$segmentId = $context?->getSegmentId() ?? 0;
		if ($segmentId <= 0)
		{
			return null; // @todo: $this->addError(ErrorCode::getNotFoundError());
		}

		$identifier = ItemIdentifier::createFromArray([
			'ENTITY_TYPE_ID' => $item->getEntityTypeId(),
			'ENTITY_ID' => $item->getId(),
		]);

		if (!$identifier)
		{
			return null; // @todo: $this->addError(ErrorCode::getNotFoundError());
		}

		$deadline = (new DateTime())->add('+15 day');
		$activity = new Entity\RepeatSale($identifier, new RepeatSale());
		$activity
			->setSubject(Loc::getMessage('CRM_REPEAT_SALE_ACTION_CREATE_ACTIVITY_TITLE', ['#ENTITY_ID#' => $item->getId()]))
			->setDescription('') // use description from segment for
			->setResponsibleId($item->getAssignedById())
			->setDeadline($deadline)
			->setAuthorId($assignmentUserId)
			->setAdditionalFields(
				[
					'PROVIDER_PARAMS' => [
						'JOB_ID' => $context?->getJobId(),
						'SEGMENT_ID' => $segmentId,
					],
					'IS_INCOMING_CHANNEL' => 'Y',
				]
			)
			->setCheckPermissions(false)
		;

		$saveResult = $activity->save();
		if ($saveResult->isSuccess())
		{
			return $activity->getId();
		}

		return null; // @todo: return errors [$saveResult->getErrors();]
	}
}
