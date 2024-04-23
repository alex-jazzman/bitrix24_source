<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration;

use Slim\App;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\Environment;
use Psr\Http\Message\ResponseInterface;
use Sotbit\RestAPI\Config\Config;

/**
 * Class BaseTestCase
 *
 * @package Sotbit\RestAPI\Tests\integration
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 03.02.2021
 */
class BaseTestCase extends \PHPUnit\Framework\TestCase
{
    public const VERSION_API = 'v1';

    public static string $jwt = '';
    public static int $userId = 0;

    /**
     * Isset available catalog
     *
     * @var int
     */
    protected static int $catalog = 0;

    /**
     * Isset available section in catalog
     *
     * @var int
     */
    protected static int $section = 0;

    /**
     * Isset available product in catalog
     *
     * @var int
     */
    protected static int $product = 0;

    /**
     * Isset available ticket in support
     *
     * @var int
     */
    protected static int $ticket = 0;

    protected $backupGlobalsBlacklist = ['DB'];

    /**
     * @param  string  $requestMethod
     * @param  string  $requestUri
     * @param  array|null  $requestData
     * @param  bool  $isAuth
     *
     * @return ResponseInterface
     * @throws \Throwable
     */
    public function runApp(
        string $requestMethod,
        string $requestUri,
        array $requestData = null,
        bool $isAuth = true
    ): ResponseInterface {
        global $argv, $argc;

        // From config module
        $requestUri = \SotbitRestAPI::getRouteMainPath().$requestUri;

        if($argv[4]) {
            $requestUri .= '?setting='.$argv[4];
        }


        $environment = Environment::mock(
            [
                'REQUEST_METHOD' => $requestMethod,
                'REQUEST_URI'    => $requestUri,
            ]
        );

        $request = Request::createFromEnvironment($environment);

        if($isAuth) {
            $request = $request->withHeader('Authorization', self::$jwt);
        }

        if(isset($requestData)) {
            $request = $request->withParsedBody($requestData);
        }

        $settings = require __DIR__.'/../../app/settings.php';

        $app = new App($settings);

        $container = $app->getContainer();

        require __DIR__.'/../../app/events.php';
        require __DIR__.'/../../app/dependencies.php';
        require __DIR__.'/../../app/repositories.php';
        require __DIR__.'/../../app/routes.php';

        return $app->process($request, new Response());
    }

    public function testApp(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API,
            null,
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('status', $result);
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);

        $this->assertStringNotContainsString('error', $result);
        $this->assertStringNotContainsString('Failed', $result);
        $this->assertStringNotContainsString('Not Found', $result);
    }

    /**
     * Test Method Not Allowed
     */
    public function testMethodNotAllowed(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API,
            null,
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(405, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('error', $result);
        $this->assertStringNotContainsString('success', $result);
    }

    public function getJson(ResponseInterface $response) {
        $result = (string) $response->getBody();
        $this->assertJson($result);
        return json_decode($result, true, 512, JSON_THROW_ON_ERROR);
    }
}
