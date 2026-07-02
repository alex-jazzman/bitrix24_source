<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller;

use Bitrix\Note\Internal\Exceptions\DocumentNotFoundException;
use Bitrix\Note\Public\Provider\DocumentProvider;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\DocumentItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Request\GetDocumentRequest;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Controller\RestController;
use Bitrix\Rest\V3\Exception\EntityNotFoundException;
use Bitrix\Rest\V3\Interaction\Response\GetResponse;

#[DtoType(DocumentItemDto::class)]
class Document extends RestController
{
	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new NoteRestAccess(),
		];
	}

	public function getAction(GetDocumentRequest $request): GetResponse
	{
		try
		{
			$view = (new DocumentProvider())->getForRead($request->id);
		}
		catch (DocumentNotFoundException)
		{
			throw new EntityNotFoundException($request->id);
		}

		$dto = new DocumentItemDto();
		$dto->id = $view->id;
		$dto->collectionId = $view->collectionId;
		$dto->parentId = $view->parentId;
		$dto->title = $view->title;
		$dto->markdown = $view->markdown;
		$dto->position = $view->position;
		$dto->createdBy = $view->createdBy;
		$dto->updatedBy = $view->updatedBy;
		$dto->createdAt = $view->createdAt;
		$dto->updatedAt = $view->updatedAt;

		return new GetResponse($dto);
	}
}
