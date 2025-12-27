Feature: Drug Search

  Scenario: User searches for a drug and views prices
    Given the application is running
    When I visit the homepage
    And I enter "AMOXICILLIN" into the search bar
    Then I should see a list of drug suggestions
    When I click on the first suggestion
    Then I should see the "Nationwide Summary" card
    When I select "Alabama"
    Then I should see the "Selected State Prices" section

  Scenario: User searches for a drug by NDC
    Given the application is running
    When I visit the homepage
    And I enter "99999999999" into the search bar
    Then I should see "LIPITOR 20MG" in the suggestions list
    When I click on the first suggestion
    Then I should see the "Nationwide Summary" card
    And the heading should contain "LIPITOR 20MG"
