<?php

declare(strict_types=1);

namespace Bitrix\Mail\Public\Service\Mailbox;

final class OrphanAlias
{
	public function __construct(
		public readonly int $id,
		public readonly int $mailboxId,
		public readonly string $email,
	)
	{
	}
}
