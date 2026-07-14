<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Documentation;

use Bitrix\Note\Infrastructure\Rest\V3\Dto\DocumentTreeItemDto;
use Bitrix\Rest\V3\Documentation\MethodProvider;
use Bitrix\Rest\V3\Schema\TypeAliasRegistry;

// note.document.tree.list returns a nested tree {items: [nodes with children], truncated}.
// items $ref DocumentTreeItemDto, whose recursive children is fixed up by
// DocumentTreeNodeSchemaProvider; the example shows the concrete nesting.
class DocumentTreeListMethodProvider extends MethodProvider
{
	protected function getTags(): array
	{
		return ['note'];
	}

	protected function getRequestBody(): array
	{
		return ['content' => ['application/json' => ['schema' => [
			'type' => 'object',
			'required' => ['collectionId'],
			'properties' => [
				'collectionId' => ['type' => 'integer'],
			],
		]]]];
	}

	protected function getResponses(): array
	{
		$itemRef = '#/components/schemas/' . TypeAliasRegistry::toPublicType(DocumentTreeItemDto::create());

		return ['200' => ['content' => ['application/json' => [
			'schema' => [
				'type' => 'object',
				'properties' => ['result' => [
					'type' => 'object',
					'properties' => [
						'items' => ['type' => 'array', 'items' => ['$ref' => $itemRef]],
						'truncated' => ['type' => 'boolean'],
					],
				]],
			],
			'example' => ['result' => [
				'items' => [[
					'id' => 10,
					'collectionId' => 123,
					'parentId' => null,
					'title' => 'Введение',
					'position' => 1,
					'children' => [[
						'id' => 11,
						'collectionId' => 123,
						'parentId' => 10,
						'title' => 'Глава 1',
						'position' => 1,
						'children' => [],
					]],
				]],
				'truncated' => false,
			]],
		]]]];
	}

	protected function getTitle(): ?string
	{
		return null;
	}

	protected function getDescription(): ?string
	{
		return null;
	}
}
