<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration;

use Slim\App;
use Sotbit\RestAPI\Config\Config;
use Slim\Psr7\Factory\StreamFactory;
use Slim\Psr7\Headers;
use Slim\Psr7\Request as SlimRequest;
use Slim\Psr7\Response as SlimResponse;
use Slim\Psr7\Uri;

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
     * @throws \Throwable
     */
    public function runApp(
        string $requestMethod,
        string $requestUri,
        array $requestData = null,
        bool $isAuth = true
    ) {
        global $argv, $argc;

        // From config module
        $requestUri = \SotbitRestAPI::getRouteMainPath().$requestUri;

        if($argv[4]) {
            $requestUri .= '?setting='.$argv[4];
        }


        $request = (new \Slim\Psr7\Factory\RequestFactory())->createRequest($requestMethod, $requestUri);


        if($isAuth) {
            $request = $request->withHeader('Authorization', self::$jwt);
        }

        if(isset($requestData)) {
            $request = $request->withParsedBody($requestData);
        }


        return $this->getAppInstance()->handle($request);
    }

    protected function getAppInstance(): App
    {
        return require __DIR__.'/../../app/app.php';
    }

    protected function createRequest(
        string $method,
        string $path,
        string $query = '',
        array $headers = ['HTTP_ACCEPT' => 'application/json;charset=utf-8'],
        array $cookies = [],
        array $serverParams = []
    ): SlimRequest {
        $uri = new Uri('', '', 80, $path, $query);
        $handle = fopen('php://temp', 'w+');
        $stream = (new StreamFactory())->createStreamFromResource($handle);

        $h = new Headers();
        foreach ($headers as $name => $value) {
            $h->addHeader($name, $value);
        }

        return new SlimRequest($method, $uri, $h, $cookies, $serverParams, $stream);
    }

    public function getJson(SlimResponse $response) {
        $result = (string) $response->getBody();
        $this->assertJson($result);
        return json_decode($result, true, 512, JSON_THROW_ON_ERROR);
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
        $this->assertEquals('application/json;charset=utf-8', $response->getHeaderLine('Content-Type'));
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



}
