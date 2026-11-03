<?php

declare(strict_types=1);

namespace Bitrix\Vibecodeconnector\Infrastructure\Service\Embed;

use Bitrix\Main\Localization\Loc;
use Bitrix\Vibecodeconnector\Internal\Dto\Embed\SignedFormPayload;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedCreateGuard;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedCreateSettings;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedOpenPayloadBuilder;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedView;

final class EmbedOpenLayoutService
{
	private const ERROR_BUILD_FAILED = 'BUILD_FAILED';
	private const ERROR_BAD_VIEW = 'BAD_VIEW';
	private const ERROR_CREATE_DISABLED = 'CREATE_DISABLED';

	private const SURFACE = 'embed-create';

	public function __construct(
		private readonly EmbedCreateGuard $guard = new EmbedCreateGuard(),
		private readonly EmbedCreateSettings $settings = new EmbedCreateSettings(),
		private readonly EmbedOpenPayloadBuilder $payloadBuilder = new EmbedOpenPayloadBuilder(),
		private readonly SignedFormRenderer $renderer = new SignedFormRenderer(self::SURFACE),
	) {
	}

	public function render(string $view, int $userId): string
	{
		$error = $this->resolveError($view, $userId);
		if ($error !== null)
		{
			return $this->renderer->renderError(...$this->errorParams($error));
		}

		$payload = $this->buildPayload(EmbedView::from($view), $userId);

		return $payload === null
			? $this->renderer->renderError(...$this->errorParams(self::ERROR_BUILD_FAILED))
			: $this->renderer->renderForm($payload);
	}

	private function resolveError(string $view, int $userId): ?string
	{
		if (!$this->settings->isEnabled())
		{
			return self::ERROR_CREATE_DISABLED;
		}

		$embedView = EmbedView::tryFrom($view);

		return $embedView === null
			? self::ERROR_BAD_VIEW
			: $this->guard->resolveErrorCode($embedView, $userId)
		;
	}

	private function buildPayload(EmbedView $view, int $userId): ?SignedFormPayload
	{
		try
		{
			return $this->payloadBuilder->build($view, $userId);
		}
		catch (\Throwable)
		{
			return null;
		}
	}

	/**
	 * @return array{string, string, string}
	 */
	private function errorParams(string $code): array
	{
		return [
			$code,
			(string)Loc::getMessage('VIBECODECONNECTOR_EMBED_CREATE_ERROR_TITLE'),
			(string)(
				Loc::getMessage('VIBECODECONNECTOR_EMBED_CREATE_ERROR_' . $code)
				?: Loc::getMessage('VIBECODECONNECTOR_EMBED_CREATE_ERROR_DEFAULT')
			),
		];
	}
}
