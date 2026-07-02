<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller;

use Bitrix\Note\Public\Provider\CollectionProvider;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\CollectionItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Request\ListCollectionsRequest;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Controller\RestController;
use Bitrix\Rest\V3\Interaction\Response\ArrayResponse;

#[DtoType(CollectionItemDto::class)]
class Collection extends RestController
{
	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new NoteRestAccess(),
		];
	}

	public function listAction(ListCollectionsRequest $request): ArrayResponse
	{
		[$limit, $afterCursor] = $this->parsePagination($request->pagination);

		$result = (new CollectionProvider())->getAccessibleList($limit, $afterCursor);

		return new ArrayResponse($result);
	}

	private function parsePagination(?array $pagination): array
	{
		$limit = CollectionProvider::DEFAULT_LIMIT;
		$afterCursor = null;

		if (is_array($pagination))
		{
			if (isset($pagination['limit']))
			{
				$requestedLimit = (int)$pagination['limit'];
				if ($requestedLimit > 0)
				{
					$limit = min($requestedLimit, CollectionProvider::MAX_LIMIT);
				}
			}
			if (isset($pagination['afterCursor']) && is_array($pagination['afterCursor']))
			{
				$cursor = $pagination['afterCursor'];
				if (isset($cursor['position'], $cursor['id']))
				{
					$afterCursor = [
						'position' => (int)$cursor['position'],
						'id' => (int)$cursor['id'],
					];
				}
			}
		}

		return [$limit, $afterCursor];
	}
}
