<?php

namespace Bitrix\Main\Grid\Action;

use Bitrix\Main\HttpRequest;
use Bitrix\Main\Result;

/**
 * Object of a single grid action.
 */
interface Action
{
	/**
	 * Action's id.
	 *
	 * @return string
	 */
	public static function getId(): string;

	/**
	 * Request processing.
	 *
	 * @param HttpRequest $request
	 *
	 * @return Result|null `null` is returned if the action does not have a handler, or the action cannot return the result object.
	 */
	public function processRequest(HttpRequest $request): ?Result;
}
