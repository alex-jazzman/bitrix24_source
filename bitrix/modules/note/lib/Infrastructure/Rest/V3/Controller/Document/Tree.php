<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller\Document;

use Bitrix\Note\Internal\Exceptions\AccessDeniedException as DomainAccessDeniedException;
use Bitrix\Note\Internal\Exceptions\CollectionNotFoundException;
use Bitrix\Note\Public\Provider\TreeProvider;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\DocumentTreeItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Request\GetDocumentTreeRequest;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Controller\RestController;
use Bitrix\Rest\V3\Exception\AccessDeniedException;
use Bitrix\Rest\V3\Exception\EntityNotFoundException;
use Bitrix\Rest\V3\Interaction\Response\ArrayResponse;

#[DtoType(DocumentTreeItemDto::class)]
class Tree extends RestController
{
	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new NoteRestAccess(),
		];
	}

	public function listAction(GetDocumentTreeRequest $request): ArrayResponse
	{
		try
		{
			$result = (new TreeProvider())->getAccessibleTree($request->collectionId);
		}
		catch (CollectionNotFoundException)
		{
			throw new EntityNotFoundException($request->collectionId);
		}
		catch (DomainAccessDeniedException)
		{
			throw new AccessDeniedException();
		}

		return new ArrayResponse($result);
	}
}
