<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Catalog;

use JsonException, Throwable;

/**
 * Class ProductTest
 *
 * @package Sotbit\RestAPI\Tests\integration\Catalog
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 27.02.2023
 */
class ProductTest extends BaseCatalogTest
{
    /**
     * Test get all products
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testGetProducts(): void
    {
        // if no isset available catalog
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/products'
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
        $this->assertArrayHasKey('data', $resultJson['message']);
        $this->assertArrayHasKey('info', $resultJson['message']);

        if(count($resultJson['message']['data'])) {
            $product = $resultJson['message']['data'][array_keys($resultJson['message']['data'])[0]];
            $this->assertArrayHasKey('ID', $product);
            $this->assertArrayHasKey('PROPERTIES', $product);
            $this->assertArrayHasKey('PRODUCT', $product);
            $this->assertArrayHasKey('PRICES', $product);
            self::$product = (int)$product['ID'];
        }
    }

    /**
     * Test available product
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testGetProduct(): void
    {
        // if no isset available catalog and product
        if(!self::$catalog && !self::$product) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/products/'.self::$product
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
        $this->assertArrayHasKey('data', $resultJson['message']);

        $product = $resultJson['message']['data'];
        $this->assertArrayHasKey('ID', $product);
        $this->assertArrayHasKey('PROPERTIES', $product);
        $this->assertArrayHasKey('PRODUCT', $product);
        $this->assertArrayHasKey('PRICES', $product);
        $this->assertArrayHasKey('OFFERS', $product);
    }

    /**
     * Test bad requst for product
     *
     * @return void
     * @throws \JsonException
     * @throws \Throwable
     */
    public function testGetProductBadRequest(): void
    {
        // if no isset available catalog
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/products/asd'
        );

        // headers
        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test not found for product
     *
     * @return void
     * @throws \JsonException
     * @throws \Throwable
     */
    public function testGetProductNotFound(): void
    {
        // if no isset available catalog
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/products/1111111111111111111'
        );

        // headers
        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test search products
     *
     * @return void
     * @throws JsonException
     * @throws Throwable
     */
    public function testProductSearch(): void
    {
        // if no isset available catalog and product
        if(!self::$catalog) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/catalog/'.self::$catalog.'/products?search=a'
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
        $this->assertArrayHasKey('data', $resultJson['message']);
    }
}
