<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Exception;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;

class AuthExternalException extends AuthUnknownException
{
	public function __construct(string $error, string $errorDescription)
	{
		$message = $error;
		if (!empty($errorDescription))
		{
			$message .= ': ' . $errorDescription;
		}
		parent::__construct($message);
	}
}
