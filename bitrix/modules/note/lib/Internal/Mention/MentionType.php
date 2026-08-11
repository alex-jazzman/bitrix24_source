<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Mention;

enum MentionType: string
{
    case User = 'user';
    case Document = 'document';
    case Collection = 'collection';
    case Task = 'task';

    // Returns the entity-selector entityId for this mention type.
    public function entityId(): string
    {
        return match($this) {
            self::Document   => 'note-document',
            self::Collection => 'note-collection',
            self::User       => 'user',
            self::Task       => 'task',
        };
    }

    // Returns the URL pattern for this mention type, or null if the URL is built by the resolver.
    public function urlFor(int $id): ?string
    {
        return match($this) {
            self::Document   => "/note/document/$id/",
            self::Collection => "/note/collection/$id/",
            self::User, self::Task => null,
        };
    }
}
