<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration;


/**
 * Class AuthLoginTest
 *
 * @package Sotbit\RestAPI\Tests\integration
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 03.02.2021
 */
class AuthTest extends BaseTestCase
{
    /**
     * Test login endpoint with invalid credentials.
     */
    public function testLoginUserFailed(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/auth',
            ['login' => 'a@b.com', 'password' => 'p'],
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('error', $result);
        $this->assertStringNotContainsString('success', $result);
        $this->assertStringNotContainsString('Authorization', $result);
        $this->assertStringNotContainsString('Bearer', $result);
    }

    /**
     * Test login endpoint without send required field login.
     */
    public function testLoginWithoutLoginField(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/auth',
            ['password' => 'p'],
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));
        //$this->assertStringContainsString('Exception', $result);
        $this->assertStringContainsString('error', $result);
        $this->assertStringNotContainsString('success', $result);
        $this->assertStringNotContainsString('Authorization', $result);
        $this->assertStringNotContainsString('Bearer', $result);
    }

    /**
     * Test login endpoint without send required field password.
     */
    public function testLoginWithoutPasswordField(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/auth',
            ['login' => 'a@b.com'],
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));
        //$this->assertStringContainsString('Exception', $result);
        $this->assertStringContainsString('error', $result);
        $this->assertStringNotContainsString('success', $result);
        $this->assertStringNotContainsString('Authorization', $result);
        $this->assertStringNotContainsString('Bearer', $result);
    }

    /**
     * Test user login endpoint and get a JWT Bearer Authorization.
     */
    public function testLogin(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/auth',
            ['login' => getenv('RESTAPI_USER'), 'password' => getenv('RESTAPI_PASS')]
        );
        $result = (string)$response->getBody();

        self::$jwt = (string)json_decode($result, false)->message->Authorization;
        self::$userId = (int)json_decode($result, false)->message->user_id;

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('Authorization', $result);
        $this->assertStringContainsString('Bearer', $result);
    }

    /**
     * Test forgot password endpoint without send required field email.
     */
    public function testForgotPasswordWithoutEmailField(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/auth/forgot',
            [''],
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('error', $result);
        $this->assertStringNotContainsString('success', $result);

        $this->assertStringNotContainsString('Authorization', $result);
        $this->assertStringNotContainsString('Bearer', $result);
    }

    /**
     * Test forgot password endpoint without send required field email.
     */
    public function testForgotPasswordNotFoundEmail(): void
    {
        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/auth/forgot',
            ['email' => 'not_found@email.com'],
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('error', $result);
        $this->assertStringNotContainsString('success', $result);
    }

    /**
     * Test forgot password endpoint without send required field email.
     */
    /*public function testForgotPassword(): void
    {
        $email = \COption::GetOptionString("main", "email_from");
        if(self::$userId) {
            $userRepository = new \Sotbit\RestAPI\Repository\UserRepository();
            $user = $userRepository->checkUserById(self::$userId);
            if($user['EMAIL']) {
                $email = $user['EMAIL'];
            }
        }

        $response = $this->runApp(
            'POST',
            '/'.self::VERSION_API.'/auth/forgot',
            ['email' => $email],
            false
        );

        $result = (string)$response->getBody();

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertStringContainsString('success', $result);
        $this->assertStringContainsString('message', $result);
        $this->assertStringContainsString('MESSAGE', $result);
        $this->assertStringContainsString('TYPE', $result);

        $this->assertStringNotContainsString('error', $result);
    }*/

}
