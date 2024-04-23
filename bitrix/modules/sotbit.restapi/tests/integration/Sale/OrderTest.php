<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Sale;

use Sotbit\RestAPI\Tests\integration\BaseTestCase;

class OrderTest extends BaseTestCase
{
    /**
     * Test get all my orders
     */
    public function testGetAllOrders(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders'
        );

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test get detail order
     */
    public function testGetCurrentOrder(): void
    {
        $responseOrders = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders'
        );
        $resultJson = $this->getJson($responseOrders);

        if($resultJson) {
            $orders = $resultJson['message']['data'];
            if(count($orders)) {
                $orderId = array_keys($orders)[0];
            }
        }

        if($orderId) {
            $response = $this->runApp(
                'GET',
                '/'.self::VERSION_API.'/orders/'.$orderId
            );

            $this->assertEquals(200, $response->getStatusCode());
            $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

            $resultJson = $this->getJson($response);
            $this->assertEquals('success', $resultJson['status']);
            $this->assertArrayHasKey('message', $resultJson);
        } else {
            $this->expectOutputString('Orders not founds!');
            $this->assertTrue(false);
        }

    }

    /**
     * Test get detail order is not found
     */
    public function testGetCurrentNotFoundOrder(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders/1234567890'
        );

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test get status order
     */
    public function testGetStatusOrder(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/orders/status/1'
        );

        $this->assertContains($response->getStatusCode(), [200, 404]);

        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test cancel order
     */
    public function testCancelNotFoundOrder(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/orders/cancel',
            ['id' => 123456789]
        );

        $this->assertContains($response->getStatusCode(), [200, 404]);

        $resultJson = $this->getJson($response);
        $this->assertEquals('error', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);

    }


    /**
     * Test get sale pay systems
     */
    public function testGetPaySystems(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/paysystems',
        );

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);

    }

    /**
     * Test get sale deliveries
     */
    public function testGetDeliveries(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/deliveries',
        );

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test get sale person types
     */
    public function testGetPersonTypes(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/persontypes',
        );

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

    /**
     * Test get sale order statuses
     */
    public function testGetOrderStatuses(): void
    {
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/sale/statuses',
        );

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }

}
