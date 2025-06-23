<?php

namespace Bitrix\Crm\Integration\AI\Operation;

use Bitrix\AI\Context;
use Bitrix\Crm\Activity\Entity;
use Bitrix\Crm\Activity\Provider\RepeatSale;
use Bitrix\Crm\Badge;
use Bitrix\Crm\Dto\Dto;
use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Crm\Integration\AI\Dto\FillRepeatSaleTipsPayload;
use Bitrix\Crm\Integration\AI\EventHandler;
use Bitrix\Crm\Integration\AI\Model\EO_Queue;
use Bitrix\Crm\Integration\AI\Result;
use Bitrix\Crm\Integration\Analytics\Builder\AI\AIBaseEvent;
use Bitrix\Crm\Integration\Analytics\Builder\AI\FillRepeatSaleTipsEvent;
use Bitrix\Crm\ItemIdentifier;
use Bitrix\Crm\RepeatSale\Segment\SegmentItemChecker;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Timeline\AI\Call\Controller;
use Bitrix\Main;
use CCrmOwnerType;

final class FillRepeatSaleTips extends AbstractOperation
{
	public const TYPE_ID = 6;
	public const CONTEXT_ID = 'fill_repeat_sale_tips';

	protected const PAYLOAD_CLASS = FillRepeatSaleTipsPayload::class;
	protected const ENGINE_CODE = EventHandler::SETTINGS_REPEAT_SALE_ENGINE_CODE;

	public static function isSuitableTarget(ItemIdentifier $target): bool
	{
		if ($target->getEntityTypeId() === CCrmOwnerType::Activity)
		{
			$activityData = Container::getInstance()->getActivityBroker()->getById($target->getEntityId());
			$providerId = $activityData['PROVIDER_ID'] ?? null;
			if ($providerId === RepeatSale::getId())
			{
				return true;
			}
		}
		
		return false;
	}

	protected function getAIPayload(): \Bitrix\Main\Result
	{
		$activity = Container::getInstance()->getActivityBroker()->getById($this->target->getEntityId());
		$checkerResult = SegmentItemChecker::getInstance()
			->setItemByActivity($activity)
			->run()
		;
		if (!$checkerResult->isSuccess())
		{
			return (new Main\Result())->addError($checkerResult->getError());
		}
		
		return (new Main\Result())->setData([
			'payload' => (new \Bitrix\AI\Payload\Prompt('repeat_sales_prompt'))
				->setMarkers([
					'client_info' => [],
					'communication_data' =>[],
					'client_segment' => [],
					'deal_fields' => []
				])
			,
		]);
	}

	protected function getStubPayload(): string
	{
		return 'Stub repeat sale tips';
	}
	
	protected static function notifyTimelineAfterSuccessfulLaunch(Result $result): void
	{
		// operation is not used in the timeline
	}
	
	protected static function notifyTimelineAfterSuccessfulJobFinish(Result $result): void
	{
		// operation is not used in the timeline
	}
	
	protected static function notifyAboutLimitExceededError(Result $result): void
	{
		// not implemented yet
	}
	
	protected static function extractPayloadFromAIResult(\Bitrix\AI\Result $result, EO_Queue $job): Dto
	{
		return new FillRepeatSaleTipsPayload([
			'tips' => $result->getPrettifiedData(),
		]);
	}
	
	protected static function getJobFinishEventBuilder(): AIBaseEvent
	{
		return new FillRepeatSaleTipsEvent();
	}
	
	protected static function onAfterSuccessfulJobFinish(Result $result, ?Context $context = null): void
	{
		/** @var FillRepeatSaleTipsPayload $payload */
		$payload = $result->getPayload();
		if (!$payload || !$result->isSuccess())
		{
			AIManager::logger()->error(
				'{date}: {class}: Error while trying to save activity of job error: {target}' . PHP_EOL,
				[
					'class' => self::class,
					'target' => $result->getTarget(),
				],
			);
			
			return;
		}
		
		$activityId = $result->getTarget()?->getEntityId();
		$activityData = Container::getInstance()->getActivityBroker()->getById($activityId);
		$activity = (new Entity\RepeatSale(
			ItemIdentifier::createFromArray($activityData),
			new RepeatSale()
		))->load($activityId);
		if (!$activity)
		{
			AIManager::logger()->error(
				'{date}: {class}: Error while trying to save activity of job error: {target}' . PHP_EOL,
				[
					'class' => self::class,
					'target' => $result->getTarget(),
				],
			);
			
			return;
		}

		$saveResult = $activity
			->setDescription($payload->tips)
			->save()
		;
		if (!$saveResult->isSuccess())
		{
			AIManager::logger()->error(
				'{date}: {class}: Error while trying to save activity of job error: {target}' . PHP_EOL,
				[
					'class' => self::class,
					'target' => $result->getTarget(),
				],
			);
			
			return;
		}
		
		self::notifyTimelinesAboutActivityUpdate($activityId);
	}
	
	protected static function notifyAboutJobError(
		Result $result,
		bool $withSyncBadges = true,
		bool $withSendAnalytics = true
	): void
	{
		$activityId = $result->getTarget()?->getEntityId();
		$nextTarget = (new Orchestrator())->findPossibleFillFieldsTarget($activityId);
		if ($nextTarget)
		{
			if ($withSyncBadges)
			{
				Controller::getInstance()->onLaunchError(
					$nextTarget,
					$activityId,
					[
						'OPERATION_TYPE_ID' => self::TYPE_ID,
						'ENGINE_ID' => self::$engineId,
						'ERRORS' => $result->getErrorMessages(),
					],
					$result->getUserId(),
				);
				
				self::syncBadges($activityId, Badge\Type\AiCallFieldsFillingResult::ERROR_PROCESS_VALUE);
			}
			
			self::notifyTimelinesAboutActivityUpdate($activityId);

			if ($withSendAnalytics)
			{
				// @todo
			}
		}
	}
}
