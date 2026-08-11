<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Exception;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

class AppNotInstalledException extends AppLayoutException
{
	protected const MESSAGE = 'Application is not installed. Please contact your intranet administrator.';
}
