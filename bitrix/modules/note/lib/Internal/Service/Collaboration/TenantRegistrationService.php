<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collaboration;

use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Main\Security\Random;
use Bitrix\Main\Web\HttpClient;
use Bitrix\Main\Web\JWT;

class TenantRegistrationService
{
	private const MODULE_ID = 'note';
	private const AUDIT_TYPE = 'NOTE_COLLAB_REGISTRATION';

	private CollabConfigService $config;

	public function __construct(CollabConfigService $config)
	{
		$this->config = $config;
	}

	public function register(): Result
	{
		$result = new Result();

		$collabHost = $this->config->getCollabHost();
		if ($collabHost === '')
		{
			return $this->fail($result, 'Collab host is not configured');
		}

		if (!$this->isSecureTransport($collabHost))
		{
			return $this->fail($result, 'HTTPS is required for collab registration, host: ' . $collabHost);
		}

		// Stage 0: Register
		$registerResult = $this->sendRegister($collabHost);
		if (!$registerResult->isSuccess())
		{
			return $this->fail($result, 'Register failed: ' . $this->errorsToString($registerResult));
		}

		$registerData = $registerResult->getData();
		$tenantId = $registerData['tenantId'];
		$portalSecretB64 = $registerData['portalSecret'];

		$this->config->setTenantId($tenantId);
		$this->config->setPortalSecret($portalSecretB64);

		$portalSecretBinary = JWT::urlsafeB64Decode($portalSecretB64);

		// Stage 1: Verify
		$verifyResult = $this->sendVerify($collabHost, $tenantId, $portalSecretBinary);
		if (!$verifyResult->isSuccess())
		{
			return $this->fail($result, 'Verify failed: ' . $this->errorsToString($verifyResult));
		}

		$verifyData = $verifyResult->getData();
		$this->config->setCollabSecret($verifyData['collabSecret']);
		$this->config->setRegistered(true);

		return $result;
	}

	private function sendRegister(string $collabHost): Result
	{
		$result = new Result();

		$httpClient = $this->createHttpClient();
		$url = $collabHost . '/tenants/register';
		$response = $httpClient->post($url, '{}');

		$statusCode = $httpClient->getStatus();
		if ($statusCode !== 202)
		{
			$result->addError($this->buildHttpError('register', $statusCode, $response));

			return $result;
		}

		$responseData = json_decode($response, true);
		if (!is_array($responseData))
		{
			$result->addError(new Error('Invalid response from register'));

			return $result;
		}

		$tenantId = $responseData['tenantId'] ?? null;
		$portalSecret = $responseData['portalSecret'] ?? null;

		if (!is_string($tenantId) || !is_string($portalSecret))
		{
			$result->addError(new Error('Missing required fields in register response'));

			return $result;
		}

		$result->setData([
			'tenantId' => $tenantId,
			'portalSecret' => $portalSecret,
		]);

		return $result;
	}

	private function sendVerify(string $collabHost, string $tenantId, string $portalSecretBinary): Result
	{
		$result = new Result();

		$challenge = JWT::urlsafeB64Encode(Random::getBytes(32));
		$collabSecretBinary = Random::getBytes(32);
		$collabSecretB64 = JWT::urlsafeB64Encode($collabSecretBinary);

		$rawBody = json_encode([
			'challenge' => $challenge,
			'collabSecret' => $collabSecretB64,
		]);

		$signature = JWT::urlsafeB64Encode(hash_hmac('sha256', $rawBody, $portalSecretBinary, true));

		$httpClient = $this->createHttpClient();
		$httpClient->setHeader('X-Signature', $signature);
		$url = $collabHost . '/tenants/' . $tenantId . '/verify';
		$response = $httpClient->post($url, $rawBody);

		$statusCode = $httpClient->getStatus();
		if ($statusCode !== 200)
		{
			$result->addError($this->buildHttpError('verify', $statusCode, $response));

			return $result;
		}

		$responseData = json_decode($response, true);
		if (!is_array($responseData))
		{
			$result->addError(new Error('Invalid response from verify'));

			return $result;
		}

		$proof = $responseData['proof'] ?? null;
		if (!is_string($proof))
		{
			$result->addError(new Error('Missing proof in verify response'));

			return $result;
		}

		$expectedProof = hash_hmac('sha256', $challenge, $portalSecretBinary, true);
		if (!hash_equals($expectedProof, JWT::urlsafeB64Decode($proof)))
		{
			$result->addError(new Error('Challenge proof verification failed'));

			return $result;
		}

		$result->setData([
			'collabSecret' => $collabSecretB64,
		]);

		return $result;
	}

	private function createHttpClient(): HttpClient
	{
		$httpClient = new HttpClient([
			'socketTimeout' => 10,
			'streamTimeout' => 30,
		]);
		$httpClient->setHeader('Content-Type', 'application/json');

		return $httpClient;
	}

	private function isSecureTransport(string $collabHost): bool
	{
		if (str_starts_with($collabHost, 'https://'))
		{
			return true;
		}

		return $this->config->isAllowInsecureHttp();
	}

	private function buildHttpError(string $step, int $statusCode, string|false $response): Error
	{
		$message = $step . ' failed with HTTP ' . $statusCode;
		if ($response !== false && $response !== '')
		{
			$decoded = json_decode($response, true);
			if (is_array($decoded) && isset($decoded['error']))
			{
				$message .= ': ' . $decoded['error'];
			}
		}

		return new Error($message);
	}

	private function fail(Result $result, string $description): Result
	{
		$this->logError($description);
		$result->addError(new Error('Collab registration failed'));

		return $result;
	}

	private function logError(string $description): void
	{
		\CEventLog::Add([
			'SEVERITY' => \CEventLog::SEVERITY_ERROR,
			'AUDIT_TYPE_ID' => self::AUDIT_TYPE,
			'MODULE_ID' => self::MODULE_ID,
			'ITEM_ID' => 'registration',
			'DESCRIPTION' => $description,
		]);
	}

	private function errorsToString(Result $result): string
	{
		$messages = [];
		foreach ($result->getErrors() as $error)
		{
			$messages[] = $error->getMessage();
		}

		return implode('; ', $messages);
	}
}
