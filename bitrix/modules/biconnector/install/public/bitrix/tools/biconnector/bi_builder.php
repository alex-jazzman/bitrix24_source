<?php

use Bitrix\BIConnector;
use Bitrix\BIConnector\Configuration\Feature;
use Bitrix\BIConnector\DataSourceConnector\SqlTimeLimit;
use Bitrix\BIConnector\Internal\Services\Concurrency\QuerySlotManager;
use Bitrix\BIConnector\Superset\Logger\Logger;
use Bitrix\BIConnector\Superset\Selfhost\License\LicenseOption;
use Bitrix\BIConnector\Superset\Selfhost\License\SelfHostedAvailability;
use Bitrix\Main;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Web\Json;

const BI_BUILDER_DEFAULT_SCRIPT_TIME_LIMIT = 60;

const BI_BUILDER_DEFAULT_SQL_TIME_LIMIT = 60;

define('NOT_CHECK_PERMISSIONS', true);
define('NO_KEEP_STATISTIC', true);
define('BX_SENDPULL_COUNTER_QUEUE_DISABLE', true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
define('SKIP_DISK_QUOTA_CHECK', true);
define('CACHED_b_file', false);
define('BX_PUBLIC_TOOLS', true);
if (isset($_GET['health']) && in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD', 'POST'], true))
{
	define('NO_AGENT_CHECK', true);
}
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

if (isset($_GET['health']))
{
	while (ob_get_length() !== false)
	{
		ob_end_clean();
	}
	header('Content-Type: application/json; charset=UTF-8');
	if (!Main\Loader::includeModule('biconnector'))
	{
		http_response_code(503);
		echo '{"error":"NO_MODULE"}';
		Main\Application::getInstance()->terminate();
	}

	if (!Feature::isPortalHealthcheckEnabled())
	{
		http_response_code(404);
		echo '{"error":"NOT_FOUND"}';
		Main\Application::getInstance()->terminate();
	}

	$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
	if ($method === 'GET' || $method === 'HEAD')
	{
		http_response_code(200);
		if ($method === 'GET')
		{
			echo '{"status":"ok"}';
		}
		Main\Application::getInstance()->terminate();
	}

	if ($method !== 'POST')
	{
		header('Allow: GET, HEAD, POST');
		http_response_code(405);
		echo '{"error":"METHOD_NOT_ALLOWED"}';
		Main\Application::getInstance()->terminate();
	}

	$rawBody = file_get_contents('php://input', false, null, 0, BIConnector\Internal\PortalHealthcheck\ResultValidator::MAX_BODY_BYTES + 1);
	$body = null;
	if ($rawBody !== false && strlen($rawBody) <= BIConnector\Internal\PortalHealthcheck\ResultValidator::MAX_BODY_BYTES)
	{
		try
		{
			$firstJsonCharacter = $rawBody[strspn($rawBody, " \t\r\n")] ?? null;
			if ($firstJsonCharacter === '{')
			{
				$body = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
			}
		}
		catch (\JsonException $exception)
		{
		}
	}
	if (!is_array($body))
	{
		http_response_code(400);
		echo '{"error":"BAD_REQUEST"}';
		Main\Application::getInstance()->terminate();
	}

	[$status, $response] = (new BIConnector\Internal\PortalHealthcheck\CallbackHandler())->handle($body);
	http_response_code($status);
	echo Json::encode($response);
	Main\Application::getInstance()->terminate();
}

/** @var CUser $USER */
if (!$USER->IsAuthorized())
{
	@session_destroy();
}

$isLoadProtectionEnabled = Option::get('biconnector', 'bi_builder_load_protection', 'N') === 'Y';

$sqlTimeLimit = 0;
if ($isLoadProtectionEnabled)
{
	$scriptTimeLimit = (int)Option::get('biconnector', 'bi_builder_script_time_limit', BI_BUILDER_DEFAULT_SCRIPT_TIME_LIMIT);
	if ($scriptTimeLimit <= 0)
	{
		$scriptTimeLimit = BI_BUILDER_DEFAULT_SCRIPT_TIME_LIMIT;
	}
	$phpMaxExecutionTime = (int)ini_get('max_execution_time');
	if ($phpMaxExecutionTime > 0 && $phpMaxExecutionTime < $scriptTimeLimit)
	{
		$scriptTimeLimit = $phpMaxExecutionTime;
	}
	@set_time_limit($scriptTimeLimit);

	ignore_user_abort(true);

	$sqlTimeLimit = (int)Option::get('biconnector', 'bi_builder_sql_time_limit', BI_BUILDER_DEFAULT_SQL_TIME_LIMIT);
	if ($sqlTimeLimit <= 0 || $sqlTimeLimit > $scriptTimeLimit)
	{
		$sqlTimeLimit = min(BI_BUILDER_DEFAULT_SQL_TIME_LIMIT, $scriptTimeLimit);
	}
}
else
{
	@set_time_limit(0);
}
while (ob_get_length() !== false)
{
	ob_end_clean();
}
header('Content-Type:application/json; charset=UTF-8');

$inputJSON = file_get_contents('php://input');
try
{
	$input = $inputJSON ? Json::decode($inputJSON) : [];
}
catch (Main\ArgumentException $e)
{
	echo Json::encode(['error' => 'BAD_REQUEST']);
	echo "\n";
	Main\Application::getInstance()->terminate();
}

$queryMetadata = is_array($input['bx_query_metadata'] ?? null) ? $input['bx_query_metadata'] : null;
unset($input['bx_query_metadata']);

if (!Main\Loader::includeModule('biconnector'))
{
	echo Json::encode(['error' => 'NO_MODULE']);
	echo "\n";
	Main\Application::getInstance()->terminate();
}

// Records the exchange when the option asks for it: the request body as it arrived, and the answer
// with the headers that state what was applied. Started here because it needs the module autoload,
// and after the buffers above were dropped, or the buffer it opens would be dropped with them.
BIConnector\Internal\Debug\WireTracer::begin((string)$inputJSON);

if (isset($_GET['superset_verify']))
{
	if (BIConnector\Superset\Config\ConfigContainer::getConfigContainer()->isPortalIdVerified())
	{
		echo Json::encode(['error' => 'ALREADY_VERIFIED']);
		echo "\n";
		Main\Application::getInstance()->terminate();
	}

	if (!isset($input['message']))
	{
		echo Json::encode(['error' => 'NO_MESSAGE']);
		echo "\n";
		Main\Application::getInstance()->terminate();
	}

	$message = $input['message'];
	$secretManager = BIConnector\Superset\Config\SecretManager::getManager();
	$encryptResult = $secretManager->encryptMessage($message);

	$result = [];
	if ($encryptResult->isSuccess())
	{
		$result = $encryptResult->getData();
	}
	else
	{
		$result = ['error' => $encryptResult->getErrors()[0]->getCode()];
	}

	echo Json::encode($result);
	echo "\n";
	Main\Application::getInstance()->terminate();
}

$supersetKey = $input['superset_key'] ?? '';
unset($input['superset_key']);

$biKey = $input['key'] ?? '';
unset($input['key']);
$languageCode = BIConnector\Integration\Superset\CultureFormatter::getLanguageCode();
$biKey = substr($biKey, 0, 32);

// The key is checked before anything is taken. The lock below is one per BI key and is waited for without a
// deadline, so a check after it makes an unauthenticated request queue for a contour it has no right to
// enter - and the wait is paid by whoever holds the key, not by the caller. Nothing is held at this point,
// so a wrong key costs one indexed lookup and leaves.
$manager = BIConnector\Manager::getInstance();
if (!$manager->checkAccessKey($biKey))
{
	echo Json::encode(['error' => 'WRONG_KEY']);
	echo "\n";
	Main\Application::getInstance()->terminate();
}

// The permission set is asked once per report opening and before the first data request, so it takes
// neither half of the load protection: not the lock below, not the slot further down. Waiting here does
// not make a report slow - the rate limiter on the engine side waits for its turn without a deadline, so
// a delayed answer becomes a stuck thread that looks like a slow portal rather than an error. A refusal
// by load would be read as "the rights did not arrive" and close the data exactly while the portal is
// overloaded.
$isPermissionSetRequest = isset($_GET['permissions']);

$lockFileName = null;
$lockFile = null;
$isLocked = false;
if (!$isLoadProtectionEnabled && !$isPermissionSetRequest)
{
	$lockFileName = CTempFile::GetAbsoluteRoot() . '/' . md5($biKey) . '-bi.lock';
	$lockFile = fopen($lockFileName, 'w');
	$isLocked = $lockFile ? flock($lockFile, LOCK_EX) : false;
}

$service = $manager->createService(BIConnector\Services\ApacheSuperset::getServiceId());
$service->setLanguage($languageCode);
// One snapshot per request: the description this request answers with must not be inherited from an
// earlier one, which matters wherever the service object outlives a single HTTP request.
$service->beginRequest();
$service->setLoadProtectionEnabled($isLoadProtectionEnabled);
$service->setSqlTimeLimitSeconds($sqlTimeLimit);

$limitManager = BIConnector\LimitManager::getInstance();
$limitManager->setService($service);
if (!$limitManager->checkLimit())
{
	$limitManager->releaseLock();
}

$tableName = isset($_GET['table']) ? (string)$_GET['table'] : null;

if (!$limitManager->isSuperset())
{
	echo Json::encode(['error' => 'NOT_SUPERSET']);
}
elseif (!Feature::isBuilderEnabled())
{
	echo Json::encode(['error' => 'DISABLED']);
}
// Rows reach the instance through Trino, bypassing the integrator, so the license barrier is repeated here.
// The same answer the control calls are blocked by: an instance is on the side of the client, so a state the
// portal refuses on must stop the rows here and not only on the instance.
elseif (SelfHostedAvailability::getInstance()->isBlocked())
{
	// One record a day and not one per request: the instance goes on asking for rows after a refusal. Parallel
	// requests may pass the window together and write a record each - taken without a lock on purpose.
	$refusalLogInterval = 86400;
	$lastRefusalLog = (int)Main\Config\Option::get('biconnector', LicenseOption::DATA_REFUSAL_LOGGED, '0');
	if (time() - $lastRefusalLog >= $refusalLogInterval)
	{
		Main\Config\Option::set('biconnector', LicenseOption::DATA_REFUSAL_LOGGED, (string)time());
		Logger::logWarning(
			[new Main\Error('Data request blocked: self-hosted licensing does not allow work')],
			['availability_state' => SelfHostedAvailability::getInstance()->getState()->value],
		);
	}

	echo Json::encode(['error' => 'LICENSE_EXPIRED']);
}
// After the shared entry checks and before the slot: the command shares the BI key contour with the
// data output and nothing else. It carries no table parameter on purpose - that is what makes a portal
// without this code answer NO_TABLE, the one sign by which the consumer tells "this portal knows nothing
// about the axis" from "the axis is off".
elseif ($isPermissionSetRequest)
{
	// Not a cast: `login[]=x` arrives as an array, and casting one prints a PHP warning ahead of the
	// answer, so the consumer gets text before the JSON instead of an error it can read. A parameter of
	// the wrong type is a broken caller, and the answer for a broken caller is BAD_REQUEST.
	$login = is_string($_GET['login'] ?? null) ? $_GET['login'] : null;

	echo Json::encode((new BIConnector\Access\Table\PermissionSetService())->getResponse($login));
}
else
{
	$slotConnection = null;
	$slotManager = null;
	$isSlotAcquired = true;

	if ($isLoadProtectionEnabled)
	{
		$slotConnection = Main\Application::getInstance()->getConnection();

		$concurrencyLimit = (int)Option::get(
			'biconnector',
			'bi_builder_concurrency_limit',
			QuerySlotManager::DEFAULT_SLOT_COUNT
		);
		if ($concurrencyLimit <= 0)
		{
			$concurrencyLimit = QuerySlotManager::DEFAULT_SLOT_COUNT;
		}
		elseif ($concurrencyLimit > QuerySlotManager::MAX_SLOT_COUNT)
		{
			$loweringLogInterval = 86400;
			$lastLoweringLog = (int)Option::get('biconnector', '~bi_builder_concurrency_limit_lowered', '0');
			if (time() - $lastLoweringLog >= $loweringLogInterval)
			{
				Option::set('biconnector', '~bi_builder_concurrency_limit_lowered', (string)time());
				Logger::logWarning(
					[new Main\Error(
						'Configured concurrency limit ' . $concurrencyLimit
						. ' is above the supported maximum and was lowered to ' . QuerySlotManager::MAX_SLOT_COUNT
					)],
				);
			}

			$concurrencyLimit = QuerySlotManager::MAX_SLOT_COUNT;
		}

		$slotManager = new QuerySlotManager($slotConnection, $concurrencyLimit);
		$isSlotAcquired = $slotManager->acquire() !== null;
	}

	if (!$isSlotAcquired)
	{
		http_response_code(429);
		echo Json::encode(['error' => 'TOO_MANY_REQUESTS']);
	}
	else
	{
		if ($slotManager)
		{
			register_shutdown_function(static function () use ($slotManager) {
				$slotManager->release();
			});
		}

		try
		{
			if (isset($_GET['show_tables']))
			{
				$tableList = $service->getTableList();
				echo Json::encode($tableList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
			}
			elseif (empty($tableName) || !$service->getTableFields($tableName))
			{
				echo Json::encode(['error' => 'NO_TABLE']);
			}
			elseif (isset($_GET['desc']))
			{
				// The extended form is served only for the exact agreed parameter and only while the feature is
				// on. With the feature off the answer must stay the plain array a client of any version expects:
				// changing its shape would break the mixed fleet the compatibility table promises to support.
				if (($_GET['caps'] ?? null) === '1' && Feature::isAggregationPushdownEnabled())
				{
					echo Json::encode($service->describeTable($tableName), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
				}
				else
				{
					$tableFields = $service->getTableFields($tableName);
					echo Json::encode(array_values($tableFields), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
				}
			}
			elseif (isset($_GET['explain']))
			{
				$limit = (int)($_GET['limit'] ?? 0);
				if ($limit > 0)
				{
					$input['limit'] = $limit;
				}
				$result = $service->getData($tableName, $input);
				if (isset($result['error']))
				{
					echo Json::encode($result);
				}
				elseif (!empty($result['sql']))
				{
					echo $result['sql'] . "\n";

					$explainConnection = $manager->getDatabaseConnection();
					$printExplain = static function () use ($explainConnection, $result) {
						try
						{
							$res = $explainConnection->query('explain ' . $result['sql']);
							if (is_object($res))
							{
								\Bitrix\BIConnector\PrettyPrinter::printQueryResult($res);
							}
						}
						catch (\Bitrix\Main\DB\SqlQueryException $e)
						{
							echo $e->getMessage();
						}
					};

					if ($isLoadProtectionEnabled)
					{
						$connectionPool = Main\Application::getInstance()->getConnectionPool();
						$connectionPool->useMasterOnly(true);
						try
						{
							if (!SqlTimeLimit::apply($explainConnection, $sqlTimeLimit))
							{
								echo Json::encode(['error' => 'SQL_ERROR']);
							}
							else
							{
								$printExplain();
							}
						}
						finally
						{
							$connectionPool->useMasterOnly(false);
						}
					}
					else
					{
						$printExplain();
					}
				}
				else
				{
					echo 'Not SQL dataset';
				}
			}
			elseif ($service->getTableFields($tableName))
			{
				$limit = (int)($_GET['limit'] ?? 0);
				if ($limit > 0)
				{
					$input['limit'] = $limit;
				}
				$result = $service->getData($tableName, $input);

				// array_key_exists and not isset: a present `aggregation: null` is a value the protocol forbids
				// and must be answered with a protocol error, not silently served by the raw path.
				$aggregationRequested = array_key_exists('aggregation', $input);

				if (isset($result['error']))
				{
					if ($aggregationRequested)
					{
						// The block is applied whole or not at all: the plugin has no way to finish the
						// aggregation itself, so a partially applied block would be a wrong number.
						header('X-Bitrix-Bi-Aggregation-Applied: N');
					}

					echo Bitrix\Main\Web\Json::encode($result);
				}
				else
				{
					// Tells the client whether the filter it delegated was actually applied to the query.
					// The response body format stays untouched, so clients that do not know this header are not
					// affected. Correctness does not depend on it either: a client that delegates a filter is
					// still expected to re-check the condition on its side.
					header('X-Bitrix-Bi-Filters-Applied: ' . (!empty($result['filtersApplied']) ? 'Y' : 'N'));

					// Fingerprint of the WHERE that actually compiled, on both the raw and the aggregated path.
					// `Filters-Applied` is one boolean for the whole set and stays `Y` even when a rule was skipped
					// for an unknown field, so it cannot carry this guarantee: once the client drops proven conjuncts
					// from what it re-checks itself, this header is the only thing left confirming them.
					if (isset($result['whereFingerprint']))
					{
						header('X-Bitrix-Bi-Where-Fingerprint: ' . (string)$result['whereFingerprint']);
					}

					// Current capabilities fingerprint on every data response, raw and aggregated alike, resolved at
					// execution time rather than when the description was served. A stale but unexpired `?desc` cache
					// otherwise lets the client narrow a predicate on capabilities that no longer describe the source,
					// and the echoed WHERE fingerprint still matches, because the portal did apply what it reports.
					$capsFingerprint = $service->getAggregationCapsFingerprint($tableName);
					if ($capsFingerprint !== null)
					{
						header('X-Bitrix-Bi-Caps-Fingerprint: ' . $capsFingerprint);
					}

					$aggregationApplied = $aggregationRequested && !empty($result['aggregationApplied']);

					// The aggregation headers may only claim success once the statement has actually run, so the
					// body is withheld until then. It is spooled into php://temp rather than held in an output
					// buffer: the protocol allows an unlimited group count, and a GROUP BY over a high-cardinality
					// key returns a body proportional to the source, which must cap memory and not the process.
					// The raw path keeps streaming.
					$aggregatedSpool = null;
					if ($aggregationApplied)
					{
						$aggregatedSpool = fopen('php://temp/maxmemory:1048576', 'r+b') ?: null;
					}

					if ($aggregationApplied)
					{
						if ($aggregatedSpool !== null)
						{
							ob_start(
								static function (string $chunk) use ($aggregatedSpool): string {
									fwrite($aggregatedSpool, $chunk);

									return '';
								},
								1048576,
							);
						}
						else
						{
							ob_start();
						}
					}

					$resultQuery = $service->printQuery(
						$tableName,
						$input,
						$_SERVER['REQUEST_METHOD'],
						$_SERVER['REQUEST_URI'],
						$limit,
						$limitManager,
						$queryMetadata,
					);

					if ($aggregationApplied)
					{
						$aggregatedBody = null;
						if ($aggregatedSpool !== null)
						{
							// Flushes the tail of the buffer into the spool; the client still received nothing.
							ob_end_flush();
						}
						else
						{
							$aggregatedBody = (string)ob_get_clean();
						}

						if ($resultQuery->isSuccess())
						{
							header('X-Bitrix-Bi-Aggregation-Applied: Y');
							// This one is present exactly when the aggregation was applied: it binds the answer to the
							// block that was requested. The capabilities fingerprint is sent above for every response.
							header('X-Bitrix-Bi-Aggregation-Fingerprint: ' . (string)$result['aggregationFingerprint']);
						}
						else
						{
							header('X-Bitrix-Bi-Aggregation-Applied: N');
						}

						if ($aggregatedSpool !== null)
						{
							rewind($aggregatedSpool);
							fpassthru($aggregatedSpool);
							fclose($aggregatedSpool);
						}
						else
						{
							echo $aggregatedBody;
						}
					}
					elseif ($aggregationRequested)
					{
						header('X-Bitrix-Bi-Aggregation-Applied: N');
					}

					if (!$resultQuery->isSuccess() && !($resultQuery->getData()['errorStreamed'] ?? false))
					{
						$errorsMsg = [];
						$errorsDescMsg = [];
						foreach ($resultQuery->getErrorCollection() as $error)
						{
							$errorsMsg[] = $error->getMessage();
							if (!empty($error->getCustomData()['description']))
							{
								$errorsDescMsg[] = $error->getCustomData()['description'];
							}
						}

						$outputError = [
							'error' => implode('; ', $errorsMsg),
						];

						if (!empty($errorsDescMsg))
						{
							$outputError['errorMessage'] = implode('; ', $errorsDescMsg);
						}

						echo Json::encode([$outputError]);
					}
				}
			}
			else
			{
				echo Json::encode(['error' => 'NO_TABLE']);
			}
		}
		finally
		{
			$slotManager?->release();
		}
	}
}

if ($isLocked)
{
	flock($lockFile, LOCK_UN);
}
if ($lockFile)
{
	fclose($lockFile);
	if (is_file($lockFileName))
	{
		unlink($lockFileName);
	}
}

\Bitrix\BIConnector\MemoryCache::expunge();

echo "\n";

\Bitrix\Main\Application::getInstance()->terminate();
