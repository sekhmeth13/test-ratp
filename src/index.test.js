import testRatp from '.';

test('output', () => {
  expect(testRatp('🐰')).toBe('🐰');
  expect(testRatp()).toBe('No args passed!');
});
