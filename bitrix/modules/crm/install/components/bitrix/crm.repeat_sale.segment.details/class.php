<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\AI\SharePrompt\Enums\Category;
use Bitrix\Crm\Category\DealCategory;
use Bitrix\Crm\Component\Base;
use Bitrix\Crm\Copilot\CallAssessment\Controller\CopilotCallAssessmentController;
use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Crm\Integration\AI\EventHandler;
use Bitrix\Crm\Integration\Bitrix24Manager;
use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\RepeatSale\Segment\SegmentItem;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\StatusTable;
use Bitrix\Main;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Localization\Loc;

if (!Main\Loader::includeModule('crm'))
{
	return;
}

class CCrmRepeatSaleSegmentDetailsComponent extends Base
{
	public function executeComponent(): void
	{
		$id = (int)($this->arParams['ID'] ?? 0);

		if ($id <= 0 || !Container::getInstance()->getRepeatSaleAvailabilityChecker()->isAvailable())
		{
			$this->showError('CRM_REPEAT_SALE_SEGMENT_DETAILS_NOT_FOUND');

			return;
		}

		$userPermissions = Container::getInstance()->getUserPermissions();

		if (!$userPermissions->repeatSale()->canRead())
		{
			$this->showError(
				'CRM_REPEAT_SALE_SEGMENT_DETAILS_ACCESS_DENIED',
				'CRM_REPEAT_SALE_SEGMENT_DETAILS_ACCESS_DENIED_DESCRIPTION',
			);

			return;
		}

		if ($id)
		{
			$segment = RepeatSaleSegmentController::getInstance()->getById($id, true);
			if (!$segment)
			{
				$this->showError('CRM_REPEAT_SALE_SEGMENT_DETAILS_NOT_FOUND');

				return;
			}

			$segmentItem = SegmentItem::createFromEntity($segment)->toArray();
		}
		else // @todo new segments cannot be created now
		{
			$this->showError('CRM_REPEAT_SALE_SEGMENT_DETAILS_NOT_FOUND');

			return;
		}

		$isAiCallEnabled = $this->isAiCallEnabled();
		$this->arResult['data'] = [
			'segment' => $segmentItem,
			'categories' => $this->getCategories(),
			'isAiCallEnabled' => $isAiCallEnabled,
			'callAssessmentId' => 1, // @todo
			'callAssessments' => $isAiCallEnabled ? $this->getCallAssessments() : [],
		];

		$this->arResult['copilotSettings'] = $this->getCopilotSettings();

		$isReadOnly = (bool)$this->request->getPost('readOnly');
		$this->arResult['readOnly'] = $isReadOnly || !$userPermissions->repeatSale()->canEdit();

		$this->includeComponentTemplate();
	}

	private function getCategories(): array
	{
		// will return categories for other entities later
		$result = [];
		foreach (DealCategory::getAll(true) as $entry)
		{
			$entityId = ($entry['ID'] > 0 ? 'DEAL_STAGE_' . $entry['ID'] : 'DEAL_STAGE');
			$items = StatusTable::loadStatusesByEntityId($entityId);

			$preparedItems = [];
			foreach ($items as $stageId => $item)
			{
				if ($item['SEMANTICS'] === null)
				{
					//customData
					$preparedItems[] = [
						'id' => $stageId,
						'name' => $item['NAME'] ?? null,
						'color' => $item['COLOR'] ?? null,
					];
				}
			}

			$result[] = [
				'id' => (int)$entry['ID'],
				'entityTypeId' => \CCrmOwnerType::Deal,
				'name' => $entry['NAME'],
				'items' => $preparedItems,
			];
		}

		return $result;
	}

	private function getCallAssessments(): array
	{
		$result = [];

		$controller = CopilotCallAssessmentController::getInstance();
		$collection = $controller->getList([
			'select' => [
				'ID',
				'TITLE',
			],
			'filter' => [
				'IS_ENABLED' => 'Y',
			],
		]);

		foreach ($collection as $item)
		{
			$result[] = [
				'id' => $item->getId(),
				'name' => $item->getTitle(),
			];
		}

		return $result;
	}

	private function isAiCallEnabled(): bool
	{
		return (
			Bitrix24Manager::isFeatureEnabled(AIManager::AI_COPILOT_FEATURE_NAME)
			&& AIManager::isAiCallProcessingEnabled()
		);
	}

	private function showError(string $messageCode, string $descriptionCode = ''): void
	{
		$this->getApplication()->IncludeComponent(
			'bitrix:ui.info.error',
			'',
			[
				'TITLE' => Loc::getMessage($messageCode),
				'DESCRIPTION' => empty($descriptionCode) ? '' : Loc::getMessage($descriptionCode),
			]
		);
	}

	private function getCopilotSettings(): array
	{
		if (!AIManager::isEnabledInGlobalSettings(EventHandler::SETTINGS_FILL_CRM_TEXT_ENABLED_CODE))
		{
			return [];
		}

		return [
			'moduleId' => 'crm',
			'contextId' => 'crm_repeat_sale_segment_prompt_' . CurrentUser::get()->getId(),
			'category' => Category::CRM_COMMENT_FIELD->value,
			'autoHide' => true,
		];
	}
}
