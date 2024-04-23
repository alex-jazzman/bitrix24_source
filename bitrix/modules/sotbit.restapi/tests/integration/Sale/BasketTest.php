<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Sale;

use Sotbit\RestAPI\Tests\integration\BaseTestCase;

class BasketTest extends BaseTestCase
{

    public function testGetBasket(): void
    {
        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/basket'
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
        $this->assertArrayHasKey('data', $resultJson['message']);
        $this->assertArrayHasKey('items', $resultJson['message']['data']);
    }

    public function testAddBasket(): void
    {
        if(!self::$product) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/sale/basket/add',
            ['id' => self::$product]
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    public function testAddBasketNotFound(): void
    {
        // request
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/sale/basket/add',
            ['id' => 11111111111111111111]
        );

        // headers
        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    public function testDeleteBasket(): void
    {
        if(!self::$product) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/sale/basket/delete',
            ['id' => self::$product]
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    public function testDeleteBasketNotFound(): void
    {
        // request
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/sale/basket/delete',
            ['id' => 1111111111111111111]
        );

        // headers
        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

}
