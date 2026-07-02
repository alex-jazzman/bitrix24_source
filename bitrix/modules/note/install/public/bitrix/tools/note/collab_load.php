<?php

use Bitrix\Main\Application;
use Bitrix\Main\Web\JWT;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Collaboration\CollabConfigService;
use Bitrix\Note\Internal\Service\Collaboration\CollabEndpointHelper;

define('NOT_CHECK_PERMISSIONS', true);
define('NO_KEEP_STATISTIC', true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
define('SKIP_DISK_QUOTA_CHECK', true);
define('CACHED_b_file', false);
define('BX_PUBLIC_TOOLS', true);
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

if (!\Bitrix\Main\Loader::includeModule('note'))
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Module not available'], 503);
	Application::getInstance()->terminate();
}

$config = new CollabConfigService();

$collabSecret = $config->getCollabSecretBinary();
if ($collabSecret === '')
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Collaboration not configured'], 503);
	Application::getInstance()->terminate();
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches))
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Missing Bearer token'], 401);
	Application::getInstance()->terminate();
}

try
{
	$claims = JWT::decode($matches[1], $collabSecret, ['HS256']);
}
catch (\Throwable)
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Invalid token'], 403);
	Application::getInstance()->terminate();
}

if (
	!isset($claims->iss, $claims->aud, $claims->tenantId)
	|| $claims->iss !== 'collab'
	|| $claims->aud !== 'bitrix-portal'
	|| !$config->isCurrentTenant((string)$claims->tenantId)
)
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Invalid token claims'], 403);
	Application::getInstance()->terminate();
}

if (!isset($claims->act) || $claims->act !== 'load')
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Invalid action'], 403);
	Application::getInstance()->terminate();
}

$docKey = isset($_GET['docKey']) ? trim((string)$_GET['docKey']) : '';
if ($docKey === '')
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Missing docKey'], 400);
	Application::getInstance()->terminate();
}

if (!isset($claims->docKey) || $claims->docKey !== $docKey)
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'DocKey mismatch'], 403);
	Application::getInstance()->terminate();
}

$docKeyData = CollabEndpointHelper::parseDocKey($docKey);
if ($docKeyData === null)
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Invalid docKey'], 400);
	Application::getInstance()->terminate();
}
if (!$config->isCurrentTenant((string)($docKeyData['tenantId'] ?? '')))
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Invalid docKey tenant'], 400);
	Application::getInstance()->terminate();
}

$documentId = (int)$docKeyData['documentId'];
$collectionId = (int)$docKeyData['collectionId'];

$repository = new DocumentRepository();
$document = $repository->getById($documentId);
if ($document === null)
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Document not found'], 404);
	Application::getInstance()->terminate();
}
if ($document->getCollectionId() !== $collectionId)
{
	CollabEndpointHelper::sendJsonResponse(['error' => 'Invalid docKey collection'], 400);
	Application::getInstance()->terminate();
}

CollabEndpointHelper::sendJsonResponse([
	'docKey' => $docKey,
	'content' => $document->getMarkdown(),
]);
