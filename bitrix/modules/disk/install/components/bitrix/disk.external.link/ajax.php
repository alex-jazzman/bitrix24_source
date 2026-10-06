<?php

use Bitrix\Disk\ExternalLink;
use Bitrix\Disk\Internal\Service\ExternalLink\ExternalLinkPasswordService;
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
	 * @return array{status: string}|null
	 */
	public function checkPasswordAction(string $hash, string $password = ''): ?array
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

		$isConfirmed = $this->getPasswordService()->validateAndConfirm($externalLink, $password);

		return [
			'status' => $isConfirmed ? 'success' : 'wrong',
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
}
