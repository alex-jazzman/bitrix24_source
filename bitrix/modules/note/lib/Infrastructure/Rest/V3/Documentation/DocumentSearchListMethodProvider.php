<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Documentation;

use Bitrix\Note\Infrastructure\Rest\V3\Dto\SearchResultItemDto;
use Bitrix\Rest\V3\Documentation\MethodProvider;
use Bitrix\Rest\V3\Schema\TypeAliasRegistry;

// note.document.search.list returns {items, hasMore}; declares the real schema for the
// otherwise-empty result. Item fields are $ref'd to SearchResultItemDto.
class DocumentSearchListMethodProvider extends MethodProvider
{
	protected function getTags(): array
	{
		return ['note'];
	}

	protected function getRequestBody(): array
	{
		return ['content' => ['application/json' => ['schema' => [
			'type' => 'object',
			'required' => ['query'],
			'properties' => [
				'query' => ['type' => 'string'],
				'pagination' => [
					'type' => 'object',
					'properties' => [
						'limit' => ['type' => 'integer'],
					],
				],
			],
		]]]];
	}

	protected function getResponses(): array
	{
		$itemRef = '#/components/schemas/' . TypeAliasRegistry::toPublicType(SearchResultItemDto::create());

		return ['200' => ['content' => ['application/json' => ['schema' => [
			'type' => 'object',
			'properties' => ['result' => [
				'type' => 'object',
				'properties' => [
					'items' => ['type' => 'array', 'items' => ['$ref' => $itemRef]],
					'hasMore' => ['type' => 'boolean'],
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
