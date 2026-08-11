<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Documentation;

use Bitrix\Note\Infrastructure\Rest\V3\Dto\CollectionItemDto;
use Bitrix\Rest\V3\Documentation\MethodProvider;
use Bitrix\Rest\V3\Schema\TypeAliasRegistry;

// note.collection.list returns ArrayResponse-shaped {items, nextCursor}, which the auto-generator
// renders as an empty result. This provider declares the real schema; item fields are $ref'd to
// CollectionItemDto so they stay in sync, only the envelope (items + nextCursor) is hand-written.
class CollectionListMethodProvider extends MethodProvider
{
	protected function getTags(): array
	{
		return ['note'];
	}

	protected function getRequestBody(): array
	{
		return ['content' => ['application/json' => ['schema' => [
			'type' => 'object',
			'properties' => [
				'pagination' => [
					'type' => 'object',
					'properties' => [
						'limit' => ['type' => 'integer'],
						'afterCursor' => [
							'type' => 'object',
							'properties' => [
								'position' => ['type' => 'integer'],
								'id' => ['type' => 'integer'],
							],
						],
					],
				],
			],
		]]]];
	}

	protected function getResponses(): array
	{
		$itemRef = '#/components/schemas/' . TypeAliasRegistry::toPublicType(CollectionItemDto::create());

		return ['200' => ['content' => ['application/json' => ['schema' => [
			'type' => 'object',
			'properties' => ['result' => [
				'type' => 'object',
				'properties' => [
					'items' => ['type' => 'array', 'items' => ['$ref' => $itemRef]],
					'nextCursor' => [
						'type' => 'object',
						'nullable' => true,
						'properties' => [
							'position' => ['type' => 'integer'],
							'id' => ['type' => 'integer'],
						],
					],
				],
			]],
		]]]]];
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
