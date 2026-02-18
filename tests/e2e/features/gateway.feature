Feature: Gateway Service
  As an API consumer
  I want to access services through the gateway
  So that I have a single entry point

  Background:
    Given the gateway is running

  Scenario: Gateway health check
    When I request gateway health
    Then the response status should be 200

  Scenario: Proxy catalog requests through gateway
    When I request catalog items via gateway
    Then the response status should be 200
    And the response should contain "items" array

  Scenario: Gateway adds X-Request-Id header
    When I request catalog items via gateway
    Then the response should have an "x-request-id" header

  Scenario: Gateway preserves provided X-Request-Id
    When I request catalog items via gateway with X-Request-Id "test-request-id-123"
    Then the response header "x-request-id" should equal "test-request-id-123"

  Scenario: Session cookie forwarded through gateway
    Given I register and login via gateway
    When I request my profile via gateway with session
    Then the response status should be 200
    And the response should contain "email"
