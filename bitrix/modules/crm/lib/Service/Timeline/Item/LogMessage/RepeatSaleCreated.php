<?php

namespace Bitrix\Crm\Service\Timeline\Item\LogMessage;

use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\Service\Timeline\Item\LogMessage;
use Bitrix\Crm\Service\Timeline\Layout\Action\JsEvent;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\ContentBlockFactory;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\LineOfTextBlocks;
use Bitrix\Main\Localization\Loc;

final class RepeatSaleCreated extends LogMessage
{
	public function getType(): string
	{
		return 'RepeatSaleCreated';
	}
	
	public function getTitle(): ?string
	{
		return Loc::getMessage('CRM_TIMELINE_LOG_REPEAT_SALE_TITLE');
	}
	
	public function getContentBlocks(): ?array
	{
		return [
			'scenario' => $this->buildScenarioBlock(),
		];
	}
	
	private function buildScenarioBlock(): LineOfTextBlocks
	{
		$params = $this->getAssociatedEntityModel()?->get('PROVIDER_PARAMS') ?? [];
		$segmentId = (int)($params['SEGMENT_ID'] ?? 0);
		$segmentName = Loc::getMessage('CRM_TIMELINE_LOG_REPEAT_SALE_UNKNOWN_SCENARIO');
		if ($segmentId > 0)
		{
			$segment = RepeatSaleSegmentController::getInstance()->getById($segmentId);
			$segmentName = $segment?->getTitle() ?? Loc::getMessage('CRM_TIMELINE_LOG_REPEAT_SALE_UNKNOWN_SCENARIO');
		}

		$textOrLink = ContentBlockFactory::createTextOrLink(
			$segmentName,
			$segmentId > 0
				? (new JsEvent('Activity:RepeatSale:OpenSegment'))->addActionParamInt('segmentId', $segmentId)
				: null
		);
		
		return (new LineOfTextBlocks())
			->addContentBlock('title', ContentBlockFactory::createTitle(Loc::getMessage('CRM_TIMELINE_LOG_REPEAT_SALE_SCENARIO')))
			->addContentBlock('value', $textOrLink->setIsBold($segmentId > 0))
		;
	}
}
