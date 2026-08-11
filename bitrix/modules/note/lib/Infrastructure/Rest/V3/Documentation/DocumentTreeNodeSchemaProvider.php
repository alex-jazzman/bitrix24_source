<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Documentation;

use Bitrix\Note\Infrastructure\Rest\V3\Dto\DocumentTreeItemDto;
use Bitrix\Rest\V3\Documentation\SchemaProvider;
use Bitrix\Rest\V3\Schema\TypeAliasRegistry;

// Overrides the auto-generated DocumentTreeItemDto component: its `children` is a bare recursive
// array the generator emits itemless (Swagger spins). Here children $refs the node itself, so the
// tree renders as a collapsible recursive model instead.
class DocumentTreeNodeSchemaProvider extends SchemaProvider
{
	protected function getProperties(): array
	{
		$self = '#/components/schemas/' . TypeAliasRegistry::toPublicType(DocumentTreeItemDto::create());

		return [
			'id' => ['type' => 'integer'],
			'collectionId' => ['type' => 'integer'],
			'parentId' => ['type' => 'integer', 'nullable' => true],
			'title' => ['type' => 'string'],
			'position' => ['type' => 'integer'],
			'children' => ['type' => 'array', 'items' => ['$ref' => $self]],
		];
	}
}
