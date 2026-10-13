import { describe, expect, it } from 'vitest';
import { socialLevers } from '../engine/social';
import { getSocialContent, SOCIAL_CATALOG } from './social';

describe('social policy content catalog', () => {
  it('has content for every engine social lever', () => {
    expect(SOCIAL_CATALOG).toHaveLength(socialLevers.length);
    for (const lever of socialLevers) {
      const content = getSocialContent(lever.id);
      expect(content, `Missing content for lever: ${lever.id}`).toBeDefined();
      expect(content?.domain).toBe(lever.domain);
      expect(content?.title.length).toBeGreaterThan(5);
      expect(content?.description.length).toBeGreaterThan(15);
      expect(content?.tradeoffPro.length).toBeGreaterThan(10);
      expect(content?.tradeoffCon.length).toBeGreaterThan(10);
    }
  });

  it('contains valid https citations for all entries', () => {
    for (const c of SOCIAL_CATALOG) {
      expect(c.citation.url.startsWith('https://'), `Invalid URL for ${c.id}: ${c.citation.url}`).toBe(true);
      expect(c.citation.text.length).toBeGreaterThan(5);
    }
  });

  it('adheres to strictly nonpartisan language rules', () => {
    const partyDenyList = ['democrat', 'republican', 'gop', 'dnc', 'rnc', 'biden', 'trump', 'obama', 'bush'];
    for (const c of SOCIAL_CATALOG) {
      const fullText = `${c.title} ${c.description} ${c.tradeoffPro} ${c.tradeoffCon}`.toLowerCase();
      for (const banned of partyDenyList) {
        expect(fullText.includes(banned), `Banned partisan term "${banned}" in ${c.id}`).toBe(false);
      }
    }
  });
});
