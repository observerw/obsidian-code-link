import { describe, it, expect } from 'vitest';
import { dedent } from '../src/utils/index';

describe('dedent', () => {
	it('should remove common leading whitespace', () => {
		const input = `
    line1
    line2
    `;
		const expected = `
line1
line2
`;
		expect(dedent(input)).toBe(expected);
	});

	it('should handle mixed indentation levels', () => {
		const input = `
    line1
      line2
    line3
`;
		const expected = `
line1
  line2
line3
`;
		expect(dedent(input)).toBe(expected);
	});

	it('should handle blank lines', () => {
		const input = `
    line1

    line2
    `;
		const expected = `
line1

line2
`;
		expect(dedent(input)).toBe(expected);
	});

	it('should handle whitespace-only lines by normalizing them to empty', () => {
		const input = '    line1\n    \n    line2';
		const expected = 'line1\n\nline2';
		expect(dedent(input)).toBe(expected);
	});

	it('should not remove whitespace if no common indent exists', () => {
		const input = 'line1\n  line2';
		expect(dedent(input)).toBe(input);
	});

	it('should handle tabs correctly', () => {
		const input = '\t\tline1\n\t\tline2';
		const expected = 'line1\nline2';
		expect(dedent(input)).toBe(expected);
	});

	it('should handle mix of tabs and spaces as separate characters (Python behavior)', () => {
		const input = '  line1\n\tline2';
		// No common leading whitespace because space != tab
		expect(dedent(input)).toBe(input);
	});

	it('should handle empty string', () => {
		expect(dedent('')).toBe('');
	});

	it('should handle whitespace-only string', () => {
		expect(dedent('  \n  ')).toBe('\n');
	});
});
