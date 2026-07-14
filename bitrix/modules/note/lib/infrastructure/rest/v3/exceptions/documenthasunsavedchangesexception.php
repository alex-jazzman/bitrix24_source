<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Exceptions;

use Bitrix\Rest\V3\Exception\RestException;

class DocumentHasUnsavedChangesException extends RestException
{
	protected const STATUS = '409 Conflict';

	public function getRegistryCode(): string
	{
		return 'NOTE_DOCUMENT_HAS_UNSAVED_CHANGES';
	}

	protected function getMessagePhraseCode(): string
	{
		return 'NOTE_REST_V3_EXCEPTION_DOCUMENTHASUNSAVEDCHANGESEXCEPTION_MSG';
	}
}
