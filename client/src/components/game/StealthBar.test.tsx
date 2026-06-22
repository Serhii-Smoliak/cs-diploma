import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StealthBar from './StealthBar';

describe('StealthBar', () => {
  it('renders nothing', () => {
    const { container } = render(<StealthBar />);
    expect(container).toBeEmptyDOMElement();
  });
});
