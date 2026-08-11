<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Exception;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

class AppHandlerNotDefinedException extends AppLayoutException
{
	protected const MESSAGE = 'The application handler is not defined.';
}
