describe('Framework -> unsupported framework', () => {
  const Framework = require('@/Framework');

  it('throws unsupported framework error', () => {
    try {
      new Framework('playright');
    } catch (e) {
      expect(e.message).toBe('Unsupported test framework selected. Valid options are: jest');
    }
  });
});