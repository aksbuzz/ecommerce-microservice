Feature: Webhooks Service
  As an authenticated user
  I want to manage webhook subscriptions
  So that I can receive notifications for events

  Background:
    Given the webhooks service is running
    And I am authenticated as a webhooks user

  Scenario: List subscriptions when empty
    When I list webhook subscriptions
    Then the response status should be 200

  Scenario: Create a webhook subscription
    When I create a webhook subscription for event "order.submitted" to "https://example.com/hook"
    Then the response status should be 201
    And the response should contain "id"
    And the response "eventType" should equal "order.submitted"

  Scenario: Delete a webhook subscription
    Given a webhook subscription exists for event "order.paid" to "https://example.com/paid"
    When I delete the last webhook subscription
    Then the response status should be 204

  Scenario: Delete non-existent subscription returns 404
    When I delete webhook subscription 999999
    Then the response status should be 404

  Scenario: Unauthenticated access returns 401
    Given I am not authenticated as webhooks user
    When I list webhooks without session
    Then the response status should be 401
