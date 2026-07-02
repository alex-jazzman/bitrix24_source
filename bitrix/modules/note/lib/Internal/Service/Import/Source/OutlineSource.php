<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source;

use Bitrix\Main\IO\File;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\HttpClient;
use Bitrix\Note\Internal\Settings;

class OutlineSource implements SourceInterface
{
	private string $baseUrl;
	private string $token;
	private ?HttpClient $httpClient;

	public function __construct(string $baseUrl, string $token, ?HttpClient $httpClient = null)
	{
		$this->baseUrl = rtrim($baseUrl, '/');
		$this->token = $token;
		$this->httpClient = $httpClient;
	}

	public function checkConnection(): SourceResult
	{
		$client = $this->getHttpClient();
		$body = $client->post($this->baseUrl . '/api/auth.info', json_encode([]));
		$status = $client->getStatus();

		if ($body === false || $status !== 200)
		{
			return new SourceResult(
				false,
				error: $this->describeHttpFailure($client, $status, $body),
				errorField: $this->resolveErrorField($status),
			);
		}

		$response = json_decode((string)$body, true);
		if (!is_array($response))
		{
			return new SourceResult(false, error: Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_INVALID_RESPONSE'));
		}

		return new SourceResult(true, [
			'instanceName' => $response['data']['team']['name'] ?? '',
		]);
	}

	private function describeHttpFailure(HttpClient $client, int $status, $body): string
	{
		if ($body === false)
		{
			$errors = $client->getError();
			if (!empty($errors))
			{
				return Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_TRANSPORT');
			}

			return Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_UNREACHABLE');
		}

		return match (true) {
			$status === 401 => Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_UNAUTHORIZED'),
			$status === 403 => Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_FORBIDDEN'),
			$status === 404 => Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_NOT_FOUND'),
			$status >= 500 => Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_SERVER', ['#STATUS#' => (string)$status]),
			default => Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_HTTP', ['#STATUS#' => (string)$status]),
		};
	}

	private function resolveErrorField(int $status): string
	{
		return ($status === 401 || $status === 403) ? 'token' : 'url';
	}

	public function getCollections(): SourceResult
	{
		$collections = [];
		$offset = 0;
		$limit = 25;

		do
		{
			$response = $this->post('/api/collections.list', [
				'limit' => $limit,
				'offset' => $offset,
			]);

			if ($response === null)
			{
				return new SourceResult(false);
			}

			foreach ($response['data'] ?? [] as $item)
			{
				$collections[] = [
					'id' => $item['id'],
					'urlId' => $item['urlId'] ?? null,
					'name' => $item['name'],
				];
			}

			$offset += $limit;
			$hasMore = count($response['data'] ?? []) === $limit;
		}
		while ($hasMore);

		return new SourceResult(true, ['collections' => $collections]);
	}

	public function getDocumentTree(string $collectionId): SourceResult
	{
		$response = $this->post('/api/collections.documents', [
			'id' => $collectionId,
		]);

		if ($response === null)
		{
			return new SourceResult(false);
		}

		return new SourceResult(true, ['documents' => $response['data'] ?? []]);
	}

	public function getDocumentsPage(string $collectionId, int $offset, int $limit): SourceResult
	{
		$response = $this->post('/api/documents.list', [
			'collectionId' => $collectionId,
			'offset' => $offset,
			'limit' => $limit,
		]);

		if ($response === null)
		{
			return new SourceResult(false);
		}

		return new SourceResult(true, [
			'documents' => $response['data'] ?? [],
			'pagination' => $response['pagination'] ?? [],
		]);
	}

	public function downloadAttachment(string $attachmentId): SourceResult
	{
		$url = $this->baseUrl . '/api/attachments.redirect?id=' . urlencode($attachmentId);
		$client = $this->getHttpClient();

		// Bitrix-managed tmp: auto-cleaned via register_shutdown_function(['CTempFile', 'Cleanup']).
		$tmpPath = \CFile::GetTempName('', 'note_att_' . bin2hex(random_bytes(8)) . '.bin');
		$tmpFile = new File($tmpPath);

		try
		{
			$client->download($url, $tmpPath);
			$status = $client->getStatus();

			if ($status === 429)
			{
				$retryAfter = (int)($client->getHeaders()->get('Retry-After') ?? 5);
				$this->deleteTmp($tmpFile);

				return new SourceResult(false, ['retryAfter' => $retryAfter]);
			}

			if ($status !== 200 || !$tmpFile->isExists())
			{
				$this->deleteTmp($tmpFile);

				return new SourceResult(false);
			}

			$size = $tmpFile->getSize();
			if ($size <= 0)
			{
				$this->deleteTmp($tmpFile);

				return new SourceResult(false, error: Loc::getMessage('NOTE_IMPORT_OUTLINE_ERROR_READ_DOWNLOAD'));
			}

			$rawContentType = $client->getHeaders()->get('Content-Type') ?? 'application/octet-stream';
			$contentType = trim(explode(';', $rawContentType)[0]);
			$disposition = $client->getHeaders()->get('Content-Disposition') ?? '';
			$fileName = $this->extractFileName($disposition) ?? ($attachmentId . '.bin');

			return new SourceResult(true, [
				'tmpPath' => $tmpPath,
				'fileName' => $fileName,
				'contentType' => $contentType,
				'size' => $size,
			]);
		}
		catch (\Throwable $e)
		{
			$this->deleteTmp($tmpFile);

			throw $e;
		}
	}

	private function deleteTmp(File $tmpFile): void
	{
		if ($tmpFile->isExists())
		{
			$tmpFile->delete();
		}
	}

	private function extractFileName(string $disposition): ?string
	{
		if (preg_match("/filename\\*=UTF-8''([^\s;]+)/i", $disposition, $m))
		{
			$decoded = rawurldecode($m[1]);
			if ($decoded !== '')
			{
				return $decoded;
			}
		}

		if (preg_match('/filename="([^"]+)"/', $disposition, $m))
		{
			return $m[1];
		}

		if (preg_match("/filename=([^\s;]+)/", $disposition, $m))
		{
			return $m[1];
		}

		return null;
	}

	private function post(string $endpoint, array $body = []): ?array
	{
		$client = $this->getHttpClient();
		$url = $this->baseUrl . $endpoint;

		$jsonBody = json_encode($body);
		$result = $client->post($url, $jsonBody);
		$status = $client->getStatus();

		if ($result === false || $status !== 200)
		{
			return null;
		}

		return json_decode($result, true);
	}

	private function getHttpClient(): HttpClient
	{
		if ($this->httpClient !== null)
		{
			return $this->httpClient;
		}

		$client = new HttpClient([
			'socketTimeout' => 30,
			'streamTimeout' => 120,
			'redirect' => true,
			'redirectMax' => 5,
		]);

		$client->setHeader('Authorization', 'Bearer ' . $this->token);
		$client->setHeader('Content-Type', 'application/json');

		if (Settings::isDevMode())
		{
			// Dev/local install: relax TLS and SSRF guard so on-prem instances
			// behind self-signed certs or private IPs can be reached.
			$client->disableSslVerification();
		}
		else
		{
			// SSRF guard: block requests to private/reserved IPs (also re-checked on each redirect).
			$client->setPrivateIp(false);
		}

		return $client;
	}
}
