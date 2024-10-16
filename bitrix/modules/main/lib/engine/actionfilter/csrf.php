<?php


namespace Bitrix\Main\Engine\ActionFilter;


use Bitrix\Main\Context;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Error;
use Bitrix\Main\Event;
use Bitrix\Main\EventResult;

final class Csrf extends Base
{
	public const HEADER_WITH_NEW_CSRF = 'X-Bitrix-New-Csrf';
	public const ERROR_INVALID_CSRF = 'invalid_csrf';

	/**
	 * @var bool
	 */
	private $enabled;
	/**
	 * @var string
	 */
	private $tokenName;
	/**
	 * @var bool
	 */
	private $returnNew;

	/**
	 * Csrf constructor.
	 *
	 * @param bool $enabled
	 * @param string $tokenName
	 * @param bool $returnNew
	 */
	public function __construct(bool $enabled = true, string $tokenName = 'sessid', bool $returnNew = true)
	{
		$this->enabled = $enabled;
		$this->tokenName = $tokenName;
		$this->returnNew = $returnNew;
		parent::__construct();
	}

	/**
	 * List allowed values of scopes where the filter should work.
	 * @return array
	 */
	public function listAllowedScopes()
	{
		return [
			Controller::SCOPE_AJAX,
		];
	}

	public function onBeforeAction(Event $event)
	{
		if (!$this->enabled)
		{
			return null;
		}

		if (!check_bitrix_sessid($this->tokenName))
		{
			$errorCustomData = [];
			if ($this->returnNew)
			{
				$errorCustomData['csrf'] = bitrix_sessid();
				Context::getCurrent()->getResponse()->addHeader(
					self::HEADER_WITH_NEW_CSRF, $errorCustomData['csrf']
				);
			}

			$this->addError(new Error(
				'Invalid csrf token',
				self::ERROR_INVALID_CSRF, $errorCustomData
			));

			return new EventResult(EventResult::ERROR, null, null, $this);
		}

		return null;
	}
}