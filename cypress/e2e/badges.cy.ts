/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * E2E Tests for Achievement Badges Feature
 * Tests the badge system API endpoints
 */

describe('Badges Feature', () => {
  describe('Badge Display API', () => {
    it('badges API returns badge list', () => {
      cy.request('/api/badges').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.badges).to.be.an('array');
        expect(response.body.total).to.be.a('number');

        if (response.body.badges.length > 0) {
          const badge = response.body.badges[0];
          expect(badge.id).to.exist;
          expect(badge.name).to.exist;
          expect(badge.category).to.exist;
          expect(badge.icon).to.exist;
          expect(badge.rarity).to.exist;
        }
      });
    });

    it('badges have correct structure', () => {
      cy.request('/api/badges').then((response) => {
        expect(response.status).to.eq(200);

        response.body.badges.forEach((badge: any) => {
          expect(badge.id).to.be.a('string');
          expect(badge.name).to.be.a('string');
          expect(['tree_builder', 'memory_keeper', 'storyteller', 'connector', 'special']).to.include(badge.category);
          expect(['common', 'rare', 'legendary']).to.include(badge.rarity);
          expect(['count', 'exists', 'manual']).to.include(badge.criteria_type);
        });
      });
    });

    it('badges can be filtered by category', () => {
      cy.request('/api/badges?category=tree_builder').then((response) => {
        expect(response.status).to.eq(200);

        response.body.badges.forEach((badge: any) => {
          expect(badge.category).to.eq('tree_builder');
        });
      });
    });

    it('badges API includes progress when requested', () => {
      cy.request('/api/badges?includeProgress=true').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.badges).to.be.an('array');
      });
    });
  });

  describe('Badge Categories', () => {
    const categories = [
      { name: 'tree_builder', expectedBadges: ['First Root', 'Growing Family', 'Family Forest', 'Dynasty'] },
      { name: 'memory_keeper', expectedBadges: ['First Snapshot', 'Photo Album', 'Gallery Curator'] },
      { name: 'storyteller', expectedBadges: ['First Tale', 'Family Bard', 'Living Archive'] },
      { name: 'connector', expectedBadges: ['First Invite', 'Family Gatherer', 'Reunion Host'] },
      { name: 'special', expectedBadges: ['Pioneer', 'Tribute Keeper'] },
    ];

    categories.forEach((category) => {
      it(`${category.name} category has expected badges`, () => {
        cy.request('/api/badges?category=' + category.name).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.badges).to.be.an('array');

          if (response.body.badges.length > 0) {
            const badgeNames = response.body.badges.map((b: any) => b.name);
            const hasExpectedBadge = category.expectedBadges.some((expected) =>
              badgeNames.includes(expected)
            );
            expect(hasExpectedBadge).to.be.true;
          }
        });
      });
    });
  });

  describe('Badge Localization', () => {
    it('badges have Russian translations', () => {
      cy.request('/api/badges').then((response) => {
        expect(response.status).to.eq(200);

        if (response.body.badges.length > 0) {
          const hasRussian = response.body.badges.some(
            (b: any) => b.name_ru && b.name_ru.length > 0
          );
          expect(hasRussian).to.be.true;
        }
      });
    });
  });
});
