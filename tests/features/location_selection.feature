Feature: Location Selection
  As a user seeking medication pricing
  I want to select specific locations or nationwide
  So that I can see location-specific pricing information

  Background:
    Given I navigate to the MyHealthPrices website

  Scenario: Select individual state
    Given I am on the medication search page
    When I click on the "California" location button
    Then the California location should be selected
    And the button should show active state

  Scenario: Select Nationwide option
    Given I am on the medication search page
    When I click on the "Nationwide" location button
    Then the Nationwide option should be selected

  Scenario: Select multiple states
    Given I am on the medication search page
    When I click on the "Texas" location button
    And I click on the "New York" location button
    Then both Texas and New York should be selected

  Scenario: Verify all 51 location options exist
    Given I am on the medication search page
    Then I should see exactly 50 state location buttons
    And I should see 1 Nationwide location button

  Scenario: Location button responsiveness
    Given I am on the medication search page
    When I hover over a location button
    Then the button should show hover state
    When I click the location button
    Then the button should show selected state immediately
