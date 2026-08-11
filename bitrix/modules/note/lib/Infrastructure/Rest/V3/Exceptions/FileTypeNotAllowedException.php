<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Exceptions;

use Bitrix\Rest\V3\Exception\RestException;

class FileTypeNotAllowedException extends RestException
{
	public function getRegistryCode(): string
	{
		return 'NOTE_FILE_TYPE_NOT_ALLOWED';
	}

	protected function getMessagePhraseCode(): string
	{
		return 'NOTE_REST_V3_EXCEPTION_FILETYPENOTALLOWEDEXCEPTION_MSG';
	}
}
