<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collaboration;

class CollabEndpointHelper
{
	public static function parseDocKey(string $docKey): ?array
	{
		$docKey = trim($docKey);
		if ($docKey === '')
		{
			return null;
		}

		$parts = explode(':', $docKey);
		if (count($parts) !== CollabConfigService::DOC_KEY_SEGMENTS_COUNT)
		{
			return null;
		}

		[$tenantId, $entityType, $collectionIdRaw, $documentIdRaw] = $parts;
		$tenantId = trim((string)$tenantId);
		if ($tenantId === '')
		{
			return null;
		}

		if ($entityType !== 'note')
		{
			return null;
		}

		$collectionId = filter_var($collectionIdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
		$documentId = filter_var($documentIdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
		if ($collectionId === false || $documentId === false)
		{
			return null;
		}

		return [
			'tenantId' => $tenantId,
			'entityType' => 'note',
			'collectionId' => $collectionId,
			'documentId' => $documentId,
		];
	}

	public static function extractDocumentIdFromDocKey(string $docKey): ?int
	{
		$docKeyData = self::parseDocKey($docKey);

		return $docKeyData['documentId'] ?? null;
	}

	public static function extractCollectionIdFromDocKey(string $docKey): ?int
	{
		$docKeyData = self::parseDocKey($docKey);

		return $docKeyData['collectionId'] ?? null;
	}

	public static function sendJsonResponse(array $data, int $statusCode = 200): void
	{
		http_response_code($statusCode);
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
	}

	public static function readJsonInput(): ?array
	{
		$raw = file_get_contents('php://input');
		if ($raw === false || $raw === '')
		{
			return null;
		}

		$decoded = json_decode($raw, true);

		return is_array($decoded) ? $decoded : null;
	}
}
