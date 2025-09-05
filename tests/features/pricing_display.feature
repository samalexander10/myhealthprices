Feature: Medication Pricing Display
  As a user seeking medication costs
  I want to see pricing information when I enter a valid medication and select locations
  So that I can compare prices across different areas

  Background:
    Given I navigate to the MyHealthPrices website

  Scenario: Display pricing for valid medication and location
    Given I am on the medication search page
    When I type "ACETAMINOPHEN 325 MG TABLET" in the medication search box
    And I select the "California" location
    And I click the Search button
    And I wait for pricing information to load
    Then I should see medication pricing information
    And the pricing should include location-specific data

  Scenario: No pricing without location selection
    Given I am on the medication search page
    When I type "ACETAMINOPHEN 325 MG TABLET" in the medication search box
    But I do not select any location
    And I click the Search button
    Then no pricing information should be displayed

  Scenario: No pricing without valid medication
    Given I am on the medication search page
    When I select the "Texas" location
    But I do not enter any medication
    Then no pricing information should be displayed

  Scenario: Pricing updates when changing locations
    Given I have entered "ACETAMINOPHEN 325 MG TABLET" in the search box
    And I have selected "Florida" location
    And I have clicked the Search button
    And pricing information is displayed
    When I change the location to "Nationwide"
    Then the pricing information should update
    And should reflect nationwide pricing

  Scenario: Multiple location pricing comparison
    Given I am on the medication search page
    When I type "ACETAMINOPHEN 325 MG TABLET" in the medication search box
    And I select multiple locations: "California", "Texas", "New York"
    And I click the Search button
    And I wait for pricing information to load
    Then I should see pricing information for each selected location
    And I should be able to compare prices across locations
