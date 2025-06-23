<?php

namespace Bitrix\Crm\Service\Timeline\Item\Activity;

use Bitrix\Crm\Format\TextHelper;
use Bitrix\Crm\Integration\AI\JobRepository;
use Bitrix\Crm\Integration\AI\Result;
use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\Service\Timeline\Context;
use Bitrix\Crm\Service\Timeline\Item\Activity;
use Bitrix\Crm\Service\Timeline\Layout\Action\JsEvent;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\ContentBlockFactory;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\Copilot\CopilotLaunchButton;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\EditableDescription;
use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock\LineOfTextBlocks;
use Bitrix\Crm\Service\Timeline\Layout\Body\Logo;
use Bitrix\Crm\Service\Timeline\Layout\Common;
use Bitrix\Crm\Service\Timeline\Layout\Footer\Button;
use Bitrix\Main\Localization\Loc;
use CCrmContentType;

final class RepeatSale extends Activity
{
	protected function getActivityTypeId(): string
	{
		return 'RepeatSale';
	}

	public function getTitle(): string
	{
		return Loc::getMessage( 'CRM_TIMELINE_ITEM_REPEAT_SALE_TITLE');
	}

	public function getIconCode(): ?string
	{
		return Common\Icon::REPEAT_SALE;
	}
	
	public function getLogo(): ?Logo
	{
		return Common\Logo::getInstance(Common\Logo::REPEAT_SALE)->createLogo();
	}
	
	public function getContentBlocks(): array
	{
		$result = [];

		$aiJobResult = JobRepository::getInstance()
			->getFillRepeatSaleTipsByActivity($this->getActivityId())
		;
		$descriptionBlock = $this->buildDescriptionBlock($aiJobResult);
		if (isset($descriptionBlock))
		{
			$result['description'] = $descriptionBlock;
		}
		
		$runCopilotBlock = $this->buildRunCopilotBlock($aiJobResult);
		if (isset($runCopilotBlock))
		{
			$result['runCopilotBlock'] = $runCopilotBlock;
		}

		$result['segment'] = $this->buildSegmentBlock();

		return $result;
	}

	public function getButtons(): array
	{
		$buttons = parent::getButtons();
		
		$buttonType = $this->isScheduled()
			? Button::TYPE_PRIMARY
			: Button::TYPE_SECONDARY
		;
		$buttons['scheduleButton'] = $this->getScheduleButton('Activity:RepeatSale:Schedule', $buttonType);

		return $buttons;
	}
	
	public function getMenuItems(): array
	{
		$menuItems = parent::getMenuItems();
		unset($menuItems['view']);

		if (!$this->hasUpdatePermission())
		{
			unset($menuItems['delete']);
		}
		
		return $menuItems;
	}
	
	public function needShowNotes(): bool
	{
		return true;
	}
	
	private function buildDescriptionBlock(?Result $aiJobResult): ?ContentBlock
	{
		// base block
		$block = (new EditableDescription())
			->setEditable(false)
			->setUseBBCodeEditor(true)
			->setBackgroundColor(
				$this->isScheduled()
					? EditableDescription::BG_COLOR_YELLOW
					: EditableDescription::BG_COLOR_WHITE
			)
		;

		// not processed by copilot
		if (is_null($aiJobResult))
		{
			$description = $this->fetchDefaultDescription();

			return empty($description)
				? null
				: $block->setCopied(true)->setText($description)
			;
		}

		// copilot in progress
		if ($aiJobResult?->isPending())
		{
			return $block
				->setCopilotResultCfg([
					'header' => Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_HEADER_PENDING'),
					'hideContent' => true,
					'animated' => true,
				])
			;
		}
		
		// copilot return success result
		if ($aiJobResult?->isSuccess())
		{
			return $block
				->setCopied(true)
				->setText($this->fetchGeneratedDescription())
				->setCopilotResultCfg([
					'header' => Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_HEADER'),
					'footer' => true,
				])
			;
		}
		
		// copilot return error
		return $block
			->setText(Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_ERROR'))
			->setCopilotResultCfg([
				'header' => Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_HEADER'),
			])
		;
	}
	
	private function buildRunCopilotBlock(?Result $aiJobResult): ?ContentBlock
	{
		$isCopilotStarted = isset($aiJobResult)
			&& ($aiJobResult->isSuccess() || $aiJobResult->isPending())
		;
		
		if ($isCopilotStarted)
		{
			return null;
		}
		
		$buttonTitle = is_null($aiJobResult)
			? Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_LAUNCH_BTN_START') // not processed by copilot
			: Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_COPILOT_LAUNCH_BTN_RETRY') // copilot return error
		;

		return (new CopilotLaunchButton())
			->setTitle($buttonTitle)
			->setAction(
				(new JsEvent('Activity:RepeatSale:LaunchCopilot'))
					->addActionParamInt('activityId', $this->getActivityId())
					->addActionParamInt('ownerTypeId', $this->getContext()->getEntityTypeId())
					->addActionParamInt('ownerId', $this->getContext()->getEntityId())
			)
		;
	}
	
	private function buildSegmentBlock(): LineOfTextBlocks
	{
		$segmentId = $this->fetchSegmentId();
		if ($segmentId > 0)
		{
			$segment = RepeatSaleSegmentController::getInstance()->getById($segmentId);
			$segmentName = $segment?->getTitle() ?? Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_UNKNOWN_SCENARIO');
		}
		
		$textOrLink = ContentBlockFactory::createTextOrLink(
			$segmentName ?? Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_UNKNOWN_SCENARIO'),
			$segmentId > 0
				? (new JsEvent('Activity:RepeatSale:OpenSegment'))->addActionParamInt('segmentId', $segmentId)
				: null
		);
		
		return (new LineOfTextBlocks())
			->addContentBlock('title', ContentBlockFactory::createTitle(Loc::getMessage('CRM_TIMELINE_ITEM_REPEAT_SALE_SCENARIO')))
			->addContentBlock('value', $textOrLink->setIsBold($segmentId > 0))
		;
	}
	
	private function fetchSegmentId(): int
	{
		$params = $this->getAssociatedEntityModel()?->get('PROVIDER_PARAMS') ?? [];
		
		return (int)($params['SEGMENT_ID'] ?? 0);
	}
	
	private function fetchDefaultDescription(): string
	{
		$segmentId = $this->fetchSegmentId();
		
		return RepeatSaleSegmentController::getInstance()->getById($segmentId)?->getPrompt() ?? '';
	}

	private function fetchGeneratedDescription(): string
	{
		$description = (string)($this->getAssociatedEntityModel()
			?->get($this->isScheduled() ? 'DESCRIPTION' : 'DESCRIPTION_RAW') ?? '')
		;
		$description = trim($description);

		// Temporarily removes [p] for mobile compatibility
		$descriptionType = (int)$this->getAssociatedEntityModel()?->get('DESCRIPTION_TYPE');
		if (
			$descriptionType === CCrmContentType::BBCode
			&& $this->getContext()->getType() === Context::MOBILE
		)
		{
			$description = TextHelper::removeParagraphs($description);
		}
		
		return $description;
	}
}
