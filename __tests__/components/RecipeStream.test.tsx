import { render, screen } from '@testing-library/react';
import RecipeStream from '@/components/RecipeStream';

// Avoid pulling the full remark/unified pipeline into jsdom
jest.mock('react-markdown', () => ({ children }: { children: string }) => (
  <div data-testid="markdown">{children}</div>
));
jest.mock('remark-gfm', () => () => undefined);

describe('RecipeStream', () => {
  describe('loading state — no content yet', () => {
    it('renders the loading dots', () => {
      render(<RecipeStream content="" loading={true} />);
      expect(screen.getByText(/analyzing your ingredients/i)).toBeInTheDocument();
    });

    it('does not render the markdown region', () => {
      render(<RecipeStream content="" loading={true} />);
      expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
    });
  });

  describe('streaming state — content arriving', () => {
    it('renders markdown content while still loading', () => {
      render(<RecipeStream content="## Pasta" loading={true} />);
      expect(screen.getByTestId('markdown')).toHaveTextContent('## Pasta');
    });

    it('does not show the loading dots once content has started', () => {
      render(<RecipeStream content="Hello" loading={true} />);
      expect(screen.queryByText(/analyzing your ingredients/i)).not.toBeInTheDocument();
    });

    it('renders the blinking cursor while loading with content', () => {
      const { container } = render(<RecipeStream content="Hello" loading={true} />);
      // The cursor is a <span> styled with the blink animation
      const cursor = container.querySelector('span[style*="blink"]');
      expect(cursor).toBeInTheDocument();
    });
  });

  describe('done state — loading finished', () => {
    it('renders the final recipe content', () => {
      render(<RecipeStream content="## Pasta Primavera\nDelicious!" loading={false} />);
      expect(screen.getByTestId('markdown')).toHaveTextContent('## Pasta Primavera');
    });

    it('does not show the blinking cursor after loading completes', () => {
      const { container } = render(<RecipeStream content="Done" loading={false} />);
      const cursor = container.querySelector('span[style*="blink"]');
      expect(cursor).not.toBeInTheDocument();
    });

    it('does not show loading dots once loading is false', () => {
      render(<RecipeStream content="Recipe here" loading={false} />);
      expect(screen.queryByText(/analyzing your ingredients/i)).not.toBeInTheDocument();
    });
  });

  describe('idle state — no content, not loading', () => {
    it('renders nothing visible', () => {
      const { container } = render(<RecipeStream content="" loading={false} />);
      // The card div exists but should be empty of meaningful content
      expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
      expect(screen.queryByText(/analyzing/i)).not.toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument(); // card shell still renders
    });
  });
});
