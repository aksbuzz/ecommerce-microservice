Feature: Identity Service
  As a user
  I want to register, login, and manage my profile
  So that I can access protected resources

  Background:
    Given the identity service is running

  Scenario: Register a new user
    When I register with a unique email and password "securepass123" and name "Jane" and lastName "Smith"
    Then the response status should be 201
    And the response "name" should equal "Jane"

  Scenario: Prevent duplicate registration
    Given a user exists with email "e2e-duplicate@test.com"
    When I register with email "e2e-duplicate@test.com" and password "securepass123" and name "John" and lastName "Doe"
    Then the response status should be 409

  Scenario: Login with valid credentials
    Given a user exists with email "e2e-login@test.com"
    When I login with email "e2e-login@test.com" and password "securepass123"
    Then the response status should be 200
    And the response should contain "user"

  Scenario: Login with wrong password
    Given a user exists with email "e2e-wrongpw@test.com"
    When I login with email "e2e-wrongpw@test.com" and password "wrongpassword"
    Then the response status should be 401

  Scenario: Get current user profile
    Given I am logged in as "e2e-profile@test.com"
    When I request GET "/api/v1/identity/me" with session
    Then the response status should be 200
    And the response "email" should equal "e2e-profile@test.com"

  Scenario: Update profile
    Given I am logged in as "e2e-update@test.com"
    When I request PATCH "/api/v1/identity/profile" with session and body:
      """
      { "city": "Seattle", "country": "US" }
      """
    Then the response status should be 200
    And the response "city" should equal "Seattle"

  Scenario: Unauthenticated access to profile returns 401
    When I request GET "/api/v1/identity/me" without session
    Then the response status should be 401

  Scenario: Logout
    Given I am logged in as "e2e-logout@test.com"
    When I logout with session
    Then the response status should be 200
