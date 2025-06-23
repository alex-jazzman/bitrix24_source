<?php

namespace Bitrix\Crm\RepeatSale\Segment;

use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Localization\Loc;
use CCrmOwnerType;

final class FillPreliminarySegments
{
	public function execute(): void
	{
		$controller = RepeatSaleSegmentController::getInstance();

		$collection = $controller->getList();
		if ($collection->isEmpty())
		{
			foreach ($this->getData() as $data)
			{
				$segment = SegmentItem::createFromArray($data);
				$controller->add($segment);
			}
		}
	}

	private function getData(): array
	{
		$entityTypeId = CCrmOwnerType::Deal;
		$factory = Container::getInstance()->getFactory($entityTypeId);

		$fieldRepository = ServiceLocator::getInstance()->get('crm.model.fieldRepository');
		$resolver = $fieldRepository->getDefaultStageIdResolver($entityTypeId);

		$params = [
			'isEnabled' => false,
			'entityTypeId' => $entityTypeId,
			'entityCategoryId' => $factory?->getDefaultCategory()?->getId() ?? 0,
			'entityStageId' => $resolver(),
			'callAssessmentId' => null,
			'isAiEnabled' => false,
			'assignmentUserIds' => [],
		];

		return [
			//$this->getLastActivityLessThen12MonthButNoActiveDeals($params),
			$this->getLastDealLostMoreThan12MonthAgo($params),
			$this->getEveryYearDeals($params),
			$this->getEveryHalfYearDeals($params),
			$this->getEveryMonthDeals($params),
		];
	}

	private function getLastDealLostMoreThan12MonthAgo(array $params): array
	{
		$data = [
			'code' => SystemSegmentCode::DEAL_LOST_MORE_12_MONTH->value,
			'title' => Loc::getMessage('CRM_FPS_12MONTH_TITLE'),
			'prompt' => Loc::getMessage('CRM_FPS_12MONTH_PROMPT'),
			'entityTitlePattern' => Loc::getMessage('CRM_FPS_12MONTH_ENTITY_TITLE_PATTERN'),
		];

		return array_merge($params, $data);
	}

	private function getLastActivityLessThen12MonthButNoActiveDeals(array $params): array
	{
		$data = [
			'code' => SystemSegmentCode::DEAL_LAST_ACTIVITY_LESS_12_MONTH->value,
			'title' => Loc::getMessage('CRM_FPS_LESS_12MONTH_TITLE'),
			'prompt' => Loc::getMessage('CRM_FPS_LESS_12MONTH_PROMPT'),
			'entityTitlePattern' => Loc::getMessage('CRM_FPS_LESS_12MONTH_ENTITY_TITLE_PATTERN'),
		];

		return array_merge($params, $data);
	}

	private function getEveryYearDeals(array $params): array
	{
		$data = [
			'code' => SystemSegmentCode::DEAL_EVERY_YEAR->value,
			'title' => Loc::getMessage('CRM_FPS_EVERY_YEAR_TITLE'),
			'prompt' => Loc::getMessage('CRM_FPS_EVERY_YEAR_PROMPT'),
			'entityTitlePattern' => Loc::getMessage('CRM_FPS_EVERY_YEAR_ENTITY_TITLE_PATTERN'),
		];

		return array_merge($params, $data);
	}

	private function getEveryHalfYearDeals(array $params): array
	{
		$data = [
			'code' => SystemSegmentCode::DEAL_EVERY_HALF_YEAR->value,
			'title' => Loc::getMessage('CRM_FPS_EVERY_HALF_YEAR_TITLE'),
			'prompt' => Loc::getMessage('CRM_FPS_EVERY_HALF_YEAR_PROMPT'),
			'entityTitlePattern' => Loc::getMessage('CRM_FPS_EVERY_HALF_YEAR_ENTITY_TITLE_PATTERN'),
		];

		return array_merge($params, $data);
	}

	private function getEveryMonthDeals(array $params): array
	{
		$data = [
			'code' => SystemSegmentCode::DEAL_EVERY_MONTH->value,
			'title' => Loc::getMessage('CRM_FPS_EVERY_MONTH_TITLE'),
			'prompt' => Loc::getMessage('CRM_FPS_EVERY_MONTH_PROMPT'),
			'entityTitlePattern' => Loc::getMessage('CRM_FPS_EVERY_MONTH_ENTITY_TITLE_PATTERN'),
		];

		return array_merge($params, $data);
	}
}