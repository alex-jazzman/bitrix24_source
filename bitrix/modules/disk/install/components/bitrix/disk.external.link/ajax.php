<?php

use Bitrix\Disk\ExternalLink;
use Bitrix\Disk\Internal\Service\ExternalLink\ExternalLinkPasswordProtectionService;
use Bitrix\Disk\Internal\Service\ExternalLink\ExternalLinkPasswordService;
use Bitrix\Disk\Internal\Service\ExternalLink\PasswordProtectionResult;
use Bitrix\Disk\Public\Provider\ExternalLinkProvider;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\ActionFilter;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!Loader::includeModule('disk'))
{
	return;
}

class DiskExternalLinkAjaxController extends \Bitrix\Main\Engine\Controller
{
	protected function getDefaultPreFilters(): array
	{
		// Public external-link page: no portal authentication, but keep CSRF protection.
		return [
			new ActionFilter\HttpMethod([ActionFilter\HttpMethod::METHOD_POST]),
			new ActionFilter\Csrf(),
		];
	}

	/**
	 * Verifies the external-link password without reloading the page.
	 * On success the password service confirms the session (TTL 24h) so the next
	 * render of the same page returns the document.
	 *
	 * @return array{status: string, captchaRequired: bool, captchaSid: ?string}|null
	 */
	public function checkPasswordAction(
		string $hash,
		string $password = '',
		?string $captchaSid = null,
		?string $captchaWord = null,
	): ?array
	{
		if ($hash === '' || !ExternalLink::isValidValueForField('HASH', $hash))
		{
			$this->addError(new Error('Invalid request.', 'arguments'));

			return null;
		}

		$externalLink = $this->getExternalLinkProvider()->getForComponentByHash($hash);
		if ($externalLink === null || $externalLink->isExpired() || !$externalLink->getObject())
		{
			// Do not disclose whether the file exists.
			$this->addError(new Error('Access denied.', 'security'));

			return null;
		}

		$result = $this->getPasswordProtectionService()->checkPassword(
			$externalLink,
			$password,
			trim((string)$this->getRequest()->getRemoteAddress()),
			$captchaSid,
			$captchaWord,
		);

		if (!$this->canReturnPasswordProtectionResult($result))
		{
			$this->addError(new Error('Access denied.', 'security'));

			return null;
		}

		return [
			'status' => $result->status,
			'captchaRequired' => $result->captchaRequired,
			'captchaSid' => $result->captchaSid,
		];
	}

	private function getExternalLinkProvider(): ExternalLinkProvider
	{
		return ServiceLocator::getInstance()->get(ExternalLinkProvider::class);
	}

	private function getPasswordService(): ExternalLinkPasswordService
	{
		return ServiceLocator::getInstance()->get(ExternalLinkPasswordService::class);
	}

	private function getPasswordProtectionService(): ExternalLinkPasswordProtectionService
	{
		return new ExternalLinkPasswordProtectionService($this->getPasswordService());
	}

	private function canReturnPasswordProtectionResult(PasswordProtectionResult $result): bool
	{
		if ($result->captchaRequired && $result->captchaSid === null)
		{
			return false;
		}

		return !(
			$result->status === PasswordProtectionResult::STATUS_CAPTCHA_REQUIRED
			&& $result->passwordChecked
		);
	}
}
