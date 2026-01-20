<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Exception;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;

class AppNotFoundException extends AppLayoutException
{
	protected const MESSAGE = 'The application was not found.';
}
