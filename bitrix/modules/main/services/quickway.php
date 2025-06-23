<?php

if (!empty($_GET['ts']) && $_GET['ts'] === 'bxviewer')
{
	return;
}

if (!empty($_GET['_gen']))
{
	return;
}

$encryptedData = $_GET['_esd'] ?? null;
if (empty($encryptedData))
{
	return;
}

function readConfig(): ?array
{
	/** @see \Bitrix\Main\Config\Configuration::CONFIGURATION_FILE_PATH */
	$settingsPath = $_SERVER['DOCUMENT_ROOT'] . '/bitrix/.settings.php';
	$settings = include($settingsPath);
	if (empty($settings))
	{
		return null;
	}

	/** @see \Bitrix\Disk\QuickAccess\Configuration::CONFIG_SECTION */
	/** @see \Bitrix\Disk\QuickAccess\Configuration::CONFIG_STORAGE */
	if (empty($settings['main.token_service']['value']['storage']))
	{
		return null;
	}

	if (!is_array($settings['main.token_service']['value']['storage']))
	{
		return null;
	}

	if (empty($settings['main.token_service']['value']['key']))
	{
		return null;
	}

	return $settings['main.token_service']['value'];
}

$config = readConfig();
if (!$config)
{
	return null;
}

function isValidSign(string $key, string $signedUserToken): bool
{
	$parts = explode('.', $signedUserToken, 2);
	if (count($parts) !== 2)
	{
		return false;
	}

	[$message, $signature] = $parts;
	if (empty($message) || empty($signature))
	{
		return false;
	}

	$key = hash('sha512', $key);
	$expectedSignature = bin2hex(hash_hmac('sha256', $message, $key, true));

	return hash_equals($expectedSignature, $signature);
}

function getMemcacheStorage(array $config): ?\Memcache
{
	if (!extension_loaded('memcache'))
	{
		return null;
	}

	$connection = new \Memcache();
	$result = $connection->pconnect($config['host'], $config['port'], 3);

	return $result ? $connection : null;
}

function getRedisStorage(array $config): ?\Redis
{
	if (!extension_loaded('redis'))
	{
		return null;
	}

	$connection = new \Redis();

	$params = [
		$config['host'],
		$config['port'],
		$config['timeout'] ?? 0,
		null,
		0,
		$config['readTimeout'] ?? 0
	];

	$result = $connection->pconnect(...$params);

	if ($result)
	{
		if (isset($config['compression']) || defined('\Redis::COMPRESSION_LZ4'))
		{
			$connection->setOption(\Redis::OPT_COMPRESSION, $config['compression'] ?? \Redis::COMPRESSION_LZ4);
			$connection->setOption(\Redis::OPT_COMPRESSION_LEVEL, $config['compression_level'] ?? \Redis::COMPRESSION_ZSTD_MAX);
		}

		if (isset($config['serializer']) || defined('\Redis::SERIALIZER_IGBINARY'))
		{
			$connection->setOption(\Redis::OPT_SERIALIZER, $config['serializer'] ?? \Redis::SERIALIZER_IGBINARY);
		}
	}

	return $result ? $connection : null;
}

function getStorage(array $config): \Memcache|\Redis|null
{
	if ($config['type'] === 'redis')
	{
		return getRedisStorage($config);
	}

	if ($config['type'] === 'memcache')
	{
		return getMemcacheStorage($config);
	}

	return null;
}

/**
 * @see \Bitrix\Disk\QuickAccess\Storage\RedisScopeStorage::hasScope
 * @see \Bitrix\Disk\QuickAccess\Storage\ScopeStorage::hasScope
 */
function hasScope(
	string $prefix,
	string $userToken,
	string $scope,
	\Redis|\Memcache $storage
): bool
{
	if (empty($scope))
	{
		return false;
	}
	$key = "{$prefix}userScopes:{$userToken}";
	if ($storage instanceof \Redis)
	{
		$expirationTime = $storage->zScore($key, $scope);
		if (!$expirationTime)
		{
			return false;
		}

		if ($expirationTime <= time())
		{
			return false;
		}

		return true;
	}
	else
	{
		$storedScopes = $storage->get($key);
		if (empty($storedScopes) || !is_string($storedScopes))
		{
			return false;
		}
		$storedScopes = decodeJson($storedScopes);
		if ($storedScopes[$scope] < time())
		{
			return false;
		}

		return true;
	}
}

function decodeJson(string $data): array
{
	return json_decode($data, true, 64) ?: [];
}

function decryptData(string $data, string $key): ?array
{
	$data = base64_decode($data, true);
	if ($data === false)
	{
		return null;
	}

	$cipherAlgorithm = 'aes-256-ctr';
	$hashAlgorithm = 'sha256';

	$ivLength = openssl_cipher_iv_length($cipherAlgorithm);
	$iv = substr($data, 0, $ivLength);
	$raw = substr($data, $ivLength);

	$keyHash = openssl_digest($iv . $key, $hashAlgorithm, true);
	$decrypted = openssl_decrypt($raw, $cipherAlgorithm, $keyHash, OPENSSL_RAW_DATA, $iv);

	if ($decrypted === false)
	{
		return null;
	}

	$hashPart = substr($decrypted, 0, strlen($keyHash));
	$result = substr($decrypted, strlen($keyHash));
	$checkHash = openssl_digest($result, $hashAlgorithm, true);

	if ($hashPart !== $checkHash)
	{
		return null;
	}

	return decodeJson($result);
}

$cookiePrefix = $config['cookiePrefix'] ?? 'BITRIX_SM';

/** @see \Bitrix\Disk\QuickAccess\ScopeTokenService::COOKIE_NAME */
$signedUserToken = $_COOKIE["{$cookiePrefix}_DTOKEN"] ?? null;
if (empty($signedUserToken))
{
	return;
}

$key = $config['key'];

if (isValidSign($key, $signedUserToken) === false)
{
	return;
}

$decryptedData = decryptData($encryptedData, $key);
if (empty($decryptedData))
{
	return;
}

$storage = getStorage($config['storage']);
if (!$storage)
{
	return;
}

$userToken = explode('.', $signedUserToken, 2)[0];

if (!hasScope($config['storage']['keyPrefix'], $userToken, $decryptedData['scope'], $storage))
{
	return;
}

/** @see \Bitrix\Disk\QuickAccess\Storage\ScopeStorage::getFileKey */
$fileInfoKey = "{$config['storage']['keyPrefix']}file:{$decryptedData['fileId']}";
$storedData = $storage->get($fileInfoKey);
if (empty($storedData))
{
	return;
}

try
{
	$storedData = json_decode($storedData, true, 3, JSON_THROW_ON_ERROR);
}
catch (\JsonException $e)
{
	return;
}

$accelRedirectPath = $storedData['path'];
$contentType = $storedData['contentType'];
$expirationTime = $storedData['expirationTime'];
$dir = $storedData['dir'];
$fileName = $storedData['filename'];
$attachmentName = $decryptedData['l'] ?? null;

if (time() > $expirationTime)
{
	return;
}

if (isset($_GET['width'], $_GET['height']))
{
	// todo: we have situations when width, height are in the link, but at the same time these are the original dimensions of the image (or they are larger)
	// that is, we do not need to resize and we must return the original. But in this case, the original will now fall into the resize_cache/ folder
	$width = (int) $_GET['width'];
	$height = (int) $_GET['height'];
	$exact = $_GET['exact'] === 'Y' ? 2 : 1;
	$resizeDir = "{$width}_{$height}_{$exact}";
	$accelRedirectPath = "/upload/resize_cache/x/{$dir}/{$resizeDir}/{$fileName}";
}

header('X-Accel-Buffering: no');
header('X-Accel-Redirect: ' . $accelRedirectPath);
header('Content-Type: ' . $contentType);
if ($attachmentName)
{
	$urlEncodedName = rawurlencode($attachmentName);
	header("Content-Disposition: attachment; filename*=utf-8''{$urlEncodedName}");
}
header('X-Gen-Src: ' . $_SERVER['REQUEST_URI'] . '&_gen=1');

die;