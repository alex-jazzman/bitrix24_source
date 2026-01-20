<?php

declare(strict_types=1);

use Bitrix\Main\IO\Path;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

\spl_autoload_register(function ($className) {
	// is controller namespace we have special autoloading
	if (stripos($className, 'Bitrix\\Rest\\Component\\AppLayout\\') === 0)
	{
		$classPath = explode('\\', $className);
		$fileName = array_pop($classPath);
		array_push($classPath, $fileName . '.php');

		$filePath = Path::combine(__DIR__, ...array_slice($classPath, 4));

		require_once $filePath;
	}
});
