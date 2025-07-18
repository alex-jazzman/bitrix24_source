<?php declare(strict_types=1);

namespace Bitrix\AI\SharePrompt\Components\Grid\Request;

use Bitrix\AI\Container;
use Bitrix\AI\Helper\DateHelper;
use Bitrix\AI\Model\PromptTable;
use Bitrix\AI\SharePrompt\Service\CategoryService;
use Bitrix\AI\SharePrompt\Service\GridPrompt\Dto\GridFilterParamsDto;
use Bitrix\AI\SharePrompt\Service\GridPrompt\Dto\GridParamsDto;
use Bitrix\AI\SharePrompt\Service\GridPrompt\Enum\OrderEnum;
use Bitrix\Main\Type\DateTime;

class FilterRequest
{
	private DateHelper $dateHelper;

	public function __construct(
		protected CategoryService $categoryService
	)
	{
	}

	public function getDataFromParams(array $params): GridParamsDto
	{
		$dto = new GridParamsDto();

		if (array_key_exists('order', $params) && is_array($params['order']))
		{
			$dto->order = $this->getOrders($params['order']);
		}

		$dto->filter = $this->getFilter($params);

		return $dto;
	}

	public function addLimiterAndOffset(GridParamsDto $gridParamsDto, array $params): GridParamsDto
	{
		if (array_key_exists('limit', $params) && is_numeric($params['limit']))
		{
			$gridParamsDto->limit = $params['limit'];
		}

		if (array_key_exists('offset', $params) && is_numeric($params['offset']))
		{
			$gridParamsDto->offset = $params['offset'];
		}

		return $gridParamsDto;
	}

	protected function getFilter(array $params): GridFilterParamsDto
	{
		$filterDto = new GridFilterParamsDto();

		if (!array_key_exists('filter', $params) || !is_array($params['filter']))
		{
			return $filterDto;
		}

		$filters = $params['filter'];

		if (array_key_exists('NAME', $filters) && is_string($filters['NAME']))
		{
			$filterDto->name = $filters['NAME'];
		}

		if (array_key_exists('TYPE', $filters) && is_string($filters['TYPE']))
		{
			$type = $filters['TYPE'];
			if (in_array($type, [PromptTable::TYPE_DEFAULT, PromptTable::TYPE_SIMPLE_TEMPLATE]))
			{
				$filterDto->types[] = $type;
			}
		}

		if (array_key_exists('AUTHOR', $filters) && is_array($filters['AUTHOR']))
		{
			foreach ($filters['AUTHOR'] as $author)
			{
				$filterDto->authors[] = (int)$author;
			}
		}

		if (array_key_exists('EDITOR', $filters) && is_array($filters['EDITOR']))
		{
			foreach ($filters['EDITOR'] as $editor)
			{
				$filterDto->editors[] = (int)$editor;
			}
		}

		if (array_key_exists('SHARE', $filters) && is_array($filters['SHARE']))
		{
			foreach ($filters['SHARE'] as $share)
			{
				$filterDto->share[] = (int)$share;
			}
		}

		if (array_key_exists('IS_ACTIVE', $filters) && is_string($filters['IS_ACTIVE']))
		{
			$filterDto->isActive = $filters['IS_ACTIVE'] === 'Y';
		}

		if (array_key_exists('IS_DELETED', $filters) && is_string($filters['IS_DELETED']))
		{
			$filterDto->isDeleted = $filters['IS_DELETED'] === 'Y';
		}

		if (array_key_exists('CATEGORIES', $filters) && is_array($filters['CATEGORIES']))
		{
			$categories = $this->categoryService->getAvailableCategoriesForSave($filters['CATEGORIES']);
			if (!empty($categories))
			{
				$filterDto->categories = array_keys($categories);
			}
		}

		if (
			array_key_exists('>=DATE_MODIFY', $filters)
			&& array_key_exists('<=DATE_MODIFY', $filters)
			&& is_string($filters['>=DATE_MODIFY'])
			&& is_string($filters['<=DATE_MODIFY'])
		)
		{
			$dateModifyStart = $this->getDateHelper()->getBitrixDateTimeFromPhp($filters['>=DATE_MODIFY']);
			$dateModifyEnd = $this->getDateHelper()->getBitrixDateTimeFromPhp($filters['<=DATE_MODIFY']);

			if (!empty($dateModifyStart) && !empty($dateModifyEnd))
			{
				$filterDto->dateModifyStart = DateTime::createFromTimestamp($dateModifyStart->getTimestamp());
				$filterDto->dateModifyEnd = DateTime::createFromTimestamp($dateModifyEnd->getTimestamp());
			}
		}

		if (
			array_key_exists('>=DATE_CREATE', $filters)
			&& array_key_exists('<=DATE_CREATE', $filters)
			&& is_string($filters['>=DATE_CREATE'])
			&& is_string($filters['<=DATE_CREATE'])
		)
		{
			$dateCreateStart = $this->getDateHelper()->getBitrixDateTimeFromPhp($filters['>=DATE_CREATE']);
			$dateCreateEnd = $this->getDateHelper()->getBitrixDateTimeFromPhp($filters['<=DATE_CREATE']);

			if (!empty($dateCreateStart) && !empty($dateCreateEnd))
			{
				$filterDto->dateCreateStart = DateTime::createFromTimestamp($dateCreateStart->getTimestamp());
				$filterDto->dateCreateEnd = DateTime::createFromTimestamp($dateCreateEnd->getTimestamp());
			}
		}

		return $filterDto;
	}

	protected function getOrders($orders): array
	{
		foreach ($orders as $field => $rule)
		{
			if (!in_array($rule, [OrderEnum::DESC, OrderEnum::ASC]))
			{
				continue;
			}

			$enum = OrderEnum::tryFrom($field);
			if (!is_null($enum))
			{
				return [$enum->value, $rule];
			}
		}

		return [];
	}

	private function getDateHelper(): DateHelper
	{
		if (empty($this->dateHelper))
		{
			$this->dateHelper = Container::init()->getItem(DateHelper::class);
		}

		return $this->dateHelper;
	}
}
