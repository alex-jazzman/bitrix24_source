<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller\Document;

use Bitrix\Note\Internal\Exceptions\AccessDeniedException as DomainAccessDeniedException;
use Bitrix\Note\Internal\Exceptions\CollectionNotFoundException;
use Bitrix\Note\Public\Provider\TreeProvider;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\DocumentTreeItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Request\GetDocumentTreeRequest;
use Bitrix\Note\Infrastructure\Rest\V3\Response\DocumentTreeListResponse;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Controller\RestController;
use Bitrix\Rest\V3\Dto\DtoCollection;
use Bitrix\Rest\V3\Exception\AccessDeniedException;
use Bitrix\Rest\V3\Exception\EntityNotFoundException;

// DtoType publishes DocumentTreeItemDto as an OpenAPI component; its itemless recursive `children`
// is overridden by DocumentTreeNodeSchemaProvider (.settings.php) into a self-$ref so it renders.
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

	public function listAction(GetDocumentTreeRequest $request): DocumentTreeListResponse
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

		$items = new DtoCollection(DocumentTreeItemDto::class);
		foreach ($result['items'] as $node)
		{
			$items->add($this->toTreeDto($node));
		}

		return new DocumentTreeListResponse($items, (bool)$result['truncated']);
	}

	// Wrap the root node in a typed DTO; nested children stay as the arrays TreeProvider built
	// and serialize verbatim, so the nested shape is preserved without a recursive mapper.
	private function toTreeDto(array $node): DocumentTreeItemDto
	{
		$dto = new DocumentTreeItemDto();
		$dto->id = (int)$node['id'];
		$dto->collectionId = (int)$node['collectionId'];
		$dto->parentId = $node['parentId'] !== null ? (int)$node['parentId'] : null;
		$dto->title = (string)$node['title'];
		$dto->position = (int)$node['position'];
		$dto->children = $node['children'];

		return $dto;
	}
}
