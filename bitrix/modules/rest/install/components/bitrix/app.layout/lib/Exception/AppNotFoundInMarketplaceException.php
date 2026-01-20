<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Exception;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;

class AppNotFoundInMarketplaceException extends AppLayoutException
{
	protected const MESSAGE = 'The application was not published in the catalog or was taken down by the developer.';
}
