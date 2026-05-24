import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PantryLensApp from '@/components/PantryLensApp';

// ── Dependency mocks ──────────────────────────────────────────────────────────

jest.mock('@/lib/canvasCompress', () => ({
  compressToBase64: jest.fn().mockResolvedValue('mockBase64'),
}));

jest.mock('react-markdown', () => ({ children }: { children: string }) => (
  <div data-testid="markdown">{children}</div>
));
jest.mock('remark-gfm', () => () => undefined);

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeImageFile = (name = 'food.jpg') =>
  new File(['img'], name, { type: 'image/jpeg' });

/**
 * Plain reader mock — avoids needing ReadableStream in jsdom.
 * Returns an object whose getReader() behaves like a consumed ReadableStream.
 */
function buildMockBody(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    getReader: () => ({
      read: jest.fn().mockImplementation(async () => {
        if (i < chunks.length) return { done: false, value: encoder.encode(chunks[i++]) };
        return { done: true, value: undefined };
      }),
    }),
  };
}

const sseChunk = (content: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

/** Minimal fetch-Response mock — only the fields the component accesses */
const mockFetchResponse = ({
  status = 200,
  body = buildMockBody([]),
  errorText = '',
}: {
  status?: number;
  body?: ReturnType<typeof buildMockBody>;
  errorText?: string;
} = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  body,
  text: jest.fn().mockResolvedValue(errorText),
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

// ── Initial render ────────────────────────────────────────────────────────────

describe('initial render', () => {
  it('shows the PantryLens heading', () => {
    render(<PantryLensApp />);
    expect(screen.getByRole('heading', { name: /pantrylens/i })).toBeInTheDocument();
  });

  it('shows the tagline', () => {
    render(<PantryLensApp />);
    expect(screen.getByText(/snap your fridge/i)).toBeInTheDocument();
  });

  it('the generate button is disabled before any image is added', () => {
    render(<PantryLensApp />);
    expect(screen.getByRole('button', { name: /generate recipe/i })).toBeDisabled();
  });

  it('does not render the recipe section on first load', () => {
    render(<PantryLensApp />);
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
  });
});

// ── Adding images ─────────────────────────────────────────────────────────────

describe('adding images', () => {
  it('enables the generate button after an image is added', async () => {
    render(<PantryLensApp />);
    const [fileInput] = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(fileInput as HTMLElement, makeImageFile());

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /generate recipe/i })).toBeEnabled()
    );
  });

  it('shows the image preview thumbnails after upload', async () => {
    render(<PantryLensApp />);
    const [fileInput] = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(fileInput as HTMLElement, makeImageFile());

    await waitFor(() =>
      expect(screen.getByAltText('Ingredient photo 1')).toBeInTheDocument()
    );
  });

  it('disables the upload area after 3 images are added', async () => {
    render(<PantryLensApp />);
    const [fileInput] = document.querySelectorAll('input[type="file"]');

    for (let i = 0; i < 3; i++) {
      await userEvent.upload(fileInput as HTMLElement, makeImageFile(`food${i}.jpg`));
    }

    await waitFor(() =>
      expect(screen.getByText('Maximum 3 images added')).toBeInTheDocument()
    );
  });

  it('removes an image when the × button is clicked', async () => {
    render(<PantryLensApp />);
    const [fileInput] = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(fileInput as HTMLElement, makeImageFile());

    await waitFor(() => screen.getByAltText('Ingredient photo 1'));

    await userEvent.click(screen.getByRole('button', { name: /remove photo 1/i }));

    await waitFor(() =>
      expect(screen.queryByAltText('Ingredient photo 1')).not.toBeInTheDocument()
    );
  });

  it('"Clear all" resets all images', async () => {
    render(<PantryLensApp />);
    const [fileInput] = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(fileInput as HTMLElement, makeImageFile());

    await waitFor(() => screen.getByText('Clear all'));
    await userEvent.click(screen.getByText('Clear all'));

    await waitFor(() =>
      expect(screen.queryByAltText('Ingredient photo 1')).not.toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /generate recipe/i })).toBeDisabled();
  });
});

// ── Recipe generation ─────────────────────────────────────────────────────────

describe('recipe generation', () => {
  async function addImageAndClick() {
    const [fileInput] = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(fileInput as HTMLElement, makeImageFile());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /generate recipe/i })).toBeEnabled()
    );
    await userEvent.click(screen.getByRole('button', { name: /generate recipe/i }));
  }

  it('shows a loading spinner during generation', async () => {
    // Never-resolving fetch keeps loading:true in place while we assert
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    render(<PantryLensApp />);
    await addImageAndClick();

    expect(screen.getByText(/cooking up your recipe/i)).toBeInTheDocument();
  });

  it('disables the generate button while loading', async () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    render(<PantryLensApp />);
    await addImageAndClick();

    expect(screen.getByRole('button', { name: /cooking up/i })).toBeDisabled();
  });

  it('streams recipe tokens progressively into the UI', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockFetchResponse({
        body: buildMockBody([sseChunk('## Pasta'), sseChunk('\n\nDelicious!'), 'data: [DONE]\n\n']),
      })
    );

    render(<PantryLensApp />);
    await addImageAndClick();

    await waitFor(() =>
      expect(screen.getByTestId('markdown')).toHaveTextContent('## Pasta')
    );
  });

  it('shows a 429 rate-limit error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse({ status: 429 }));

    render(<PantryLensApp />);
    await addImageAndClick();

    await waitFor(() =>
      expect(screen.getByText(/hourly limit/i)).toBeInTheDocument()
    );
  });

  it('shows a generic error message on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<PantryLensApp />);
    await addImageAndClick();

    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    );
  });

  it('POSTs image data to /api/analyze', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockFetchResponse({ body: buildMockBody(['data: [DONE]\n\n']) })
    );

    render(<PantryLensApp />);
    await addImageAndClick();

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/analyze');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).images).toContain('mockBase64');
  });
});
