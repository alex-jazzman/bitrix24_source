<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Exceptions;

use Bitrix\Rest\V3\Exception\RestException;

class EmptyUpdateException extends RestException
{
	public function getRegistryCode(): string
	{
		return 'NOTE_EMPTY_UPDATE';
	}

	protected function getMessagePhraseCode(): string
	{
		return 'NOTE_REST_V3_EXCEPTION_EMPTYUPDATEEXCEPTION_MSG';
	}
}
