/**
 * E2E Tests for Story Prompts Feature
 * Tests the prompt API endpoints (requires authentication)
 */

describe('Story Prompts Feature', () => {
  describe('Prompt Library (Authentication Required)', () => {
    it('prompts API requires authentication', () => {
      cy.request({
        url: '/api/prompts',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.error).to.eq('Unauthorized');
      });
    });

    it('prompts category filter requires authentication', () => {
      cy.request({
        url: '/api/prompts?category=childhood',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  describe('Prompt Assignment (API)', () => {
    it('assign endpoint requires authentication', () => {
      cy.request({
        method: 'POST',
        url: '/api/prompts/assign',
        body: {
          promptId: 'test-prompt-id',
          toUserId: 'test-user-id',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });
});
