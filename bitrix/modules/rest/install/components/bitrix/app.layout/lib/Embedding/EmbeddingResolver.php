<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Embedding;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;
use Bitrix\Rest;
use Bitrix\Rest\Component\AppLayout;
use Bitrix\Rest\Internal\Entity\Application\Embedding\Embedding;
use Bitrix\Rest\Internal\Repository\EmbeddingRepository;
use Bitrix\Rest\Internal\Service\Embedding\ApplicationOnlyPlacements;
use Bitrix\Rest\Internal\Service\Embedding\EmbeddingOwnerResolver;
use Bitrix\Rest\Internal\Service\Embedding\LegacyNonAppEmbeddingsAvailability;
use Bitrix\Rest\Internal\Service\Placement\LegacyAppIdPresenter;
use Bitrix\Rest\Public\Provider\Dto\Embedding\EmbeddingOpenDto;
use Bitrix\Rest\Public\Provider\Embedding\EmbeddingDtoMapper;
use Bitrix\Rest\Public\Provider\EmbeddingProvider;

final class EmbeddingResolver
{
	public function resolve(int $legacyAppId, int $placementId): ?Embedding
	{
		$embeddingId = (new LegacyAppIdPresenter())->decodeEmbeddingId($legacyAppId);
		if ($embeddingId === null)
		{
			return null;
		}

		if (!(new LegacyNonAppEmbeddingsAvailability())->isEnabled())
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		if ($placementId <= 0 || $embeddingId !== $placementId)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		$embedding = (new EmbeddingRepository())->getById($placementId, withLanguages: true);
		if ($embedding === null)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		if (!EmbeddingOwnerResolver::isNonAppOwnerEmbedding($embedding))
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		return $embedding;
	}

	public function checkAccess(Embedding $embedding, int $userId, string $placement): void
	{
		if ($userId <= 0)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		if ((new ApplicationOnlyPlacements())->contains((string)$embedding->getPlacement()))
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		if (mb_strtoupper((string)$embedding->getPlacement()) !== $placement)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		$targetUserId = (int)$embedding->getUserId();
		if (
			$targetUserId !== Rest\PlacementTable::DEFAULT_USER_ID_VALUE
			&& $targetUserId !== $userId
		)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}
	}

	public function resolveOpen(Embedding $embedding, int $userId, mixed $placementOptions = null): EmbeddingOpenDto
	{
		$dto = (new EmbeddingDtoMapper())->mapFromEntity($embedding);
		if ($dto === null)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		try
		{
			$open = (new EmbeddingProvider())->resolveOpen(
				$dto,
				$userId,
			);
		}
		catch (\Throwable $exception)
		{
			$this->logFailure($embedding, $exception);

			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		if ($open === null)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}

		if ($placementOptions === null)
		{
			return $open;
		}

		try
		{
			$optionsJson = $this->normalizePlacementOptions($placementOptions);
			return new EmbeddingOpenDto(
				embeddingId: $open->embeddingId,
				url: $open->url,
				payload: array_merge($open->payload, [
					'PLACEMENT' => mb_strtoupper((string)$embedding->getPlacement()),
					'PLACEMENT_ID' => (int)$embedding->getId(),
					'PLACEMENT_OPTIONS' => $optionsJson,
				]),
				method: $open->method,
			);
		}
		catch (\Throwable)
		{
			throw new AppLayout\Exception\EmbeddingUnavailableException();
		}
	}

	private function normalizePlacementOptions(mixed $placementOptions): string
	{
		if ($placementOptions === '' || $placementOptions === [])
		{
			return '{}';
		}

		if (is_string($placementOptions))
		{
			if (!(json_decode($placementOptions, false, 512, JSON_THROW_ON_ERROR) instanceof \stdClass))
			{
				throw new \InvalidArgumentException('Placement options must be a JSON object');
			}

			return $placementOptions;
		}

		if (is_array($placementOptions) && !array_is_list($placementOptions))
		{
			return Main\Web\Json::encode((object)$placementOptions);
		}

		throw new \InvalidArgumentException('Placement options must be a JSON object');
	}

	public function resolveTitle(Embedding $embedding): string
	{
		$languages = [];
		foreach ($embedding->getLanguages() as $language)
		{
			$languageTitle = trim((string)$language->getTitle());
			if ($languageTitle === '')
			{
				continue;
			}

			$languages[$language->getLanguageId()] = ['TITLE' => $languageTitle];
		}

		$title = trim((string)(Rest\Lang::mergeFromLangAll([
			'TITLE' => $embedding->getTitle(),
			'LANG_ALL' => $languages,
		])['TITLE'] ?? ''));

		return $title === '' ? (string)Rest\PlacementTable::getDefaultTitle((int)$embedding->getId()) : $title;
	}

	private function logFailure(Embedding $embedding, \Throwable $exception): void
	{
		$message = sprintf(
			'Embedding is unavailable: id=%d, moduleId=%s, entityType=%s',
			(int)$embedding->getId(),
			(string)$embedding->getModuleId(),
			(string)$embedding->getEntityType(),
		);

		Main\Application::getInstance()->getExceptionHandler()->writeToLog(
			new AppLayout\Exception\EmbeddingUnavailableException($message, previous: $exception),
		);
	}
}
