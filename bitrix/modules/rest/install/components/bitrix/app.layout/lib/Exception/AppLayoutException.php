<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Exception;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;

class AppLayoutException extends Main\SystemException
{
	protected const MESSAGE = 'An error occurred in the application layout.';
	public function __construct($message = "", $code = 0, $file = "", $line = 0, \Throwable $previous = null)
	{
		$message = empty($message) ? self::MESSAGE : $message;
		parent::__construct($message , $code, $file, $line, $previous);
	}
}
