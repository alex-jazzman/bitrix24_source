<?php

namespace Bitrix\Crm\RepeatSale\Segment;

use Bitrix\Crm\Controller\ErrorCode;
use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\Traits\Singleton;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;

final class SegmentItemChecker
{
	use Singleton;
	
	private ?SegmentItem $item = null;

	public function setItem(?SegmentItem $item): self
	{
		$this->item = $item;
		
		return $this;
	}
	
	public function setItemByActivity(array $activity): self
	{
		$segmentId = (int)($activity['PROVIDER_PARAMS']['SEGMENT_ID'] ?? 0);
		$entity = RepeatSaleSegmentController::getInstance()->getById($segmentId);
		if ($entity)
		{
			$this->item = SegmentItem::createFromEntity($entity);
		}
		
		return $this;
	}

	public function run(): Result
	{
		$result = new Result();
		
		if (!$this->item)
		{
			return $result->addError(new Error(
				Loc::getMessage('CRM_SEGMENT_ITEM_NOT_FOUND'),
				ErrorCode::NOT_FOUND
			));
		}
		
		if (!$this->item->isEnabled())
		{
			return $result->addError(new Error(
				Loc::getMessage('CRM_SEGMENT_ITEM_DISABLED'),
				'CRM_SEGMENT_ITEM_DISABLED'
			));
		}
		
		if (!$this->item->isAiEnabled())
		{
			return $result->addError(new Error(
				Loc::getMessage('CRM_SEGMENT_ITEM_AI_DISABLED'),
				'CRM_SEGMENT_ITEM_AI_DISABLED'
			));
		}
		
		if (
			$this->isTitleEmpty()
			|| $this->isPromptEmpty()
		)
		{
			return $result->addError(new Error(
				Loc::getMessage('CRM_SEGMENT_ITEM_INVALID'),
				ErrorCode::INVALID_ARG_VALUE
			));
		}
		
		return $result; // success
	}
	
	private function isTitleEmpty(): bool
	{
		return empty(trim($this->item->getTitle()));
	}

	private function isPromptEmpty(): bool
	{
		return empty(trim($this->item->getPrompt()));
	}
}
