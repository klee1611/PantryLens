import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImagePreview from '@/components/ImagePreview';

const fakeImages = ['base64One', 'base64Two', 'base64Three'];

describe('ImagePreview', () => {
  const onRemove = jest.fn();

  beforeEach(() => onRemove.mockClear());

  it('renders a thumbnail for each image', () => {
    render(<ImagePreview images={fakeImages.slice(0, 2)} onRemove={onRemove} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
  });

  it('sets the correct src with data URI prefix', () => {
    render(<ImagePreview images={['abc123']} onRemove={onRemove} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,abc123');
  });

  it('shows the "+" placeholder when fewer than 3 images', () => {
    render(<ImagePreview images={['one', 'two']} onRemove={onRemove} />);
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('does NOT show the "+" placeholder when exactly 3 images', () => {
    render(<ImagePreview images={fakeImages} onRemove={onRemove} />);
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('renders descriptive alt text for each image', () => {
    render(<ImagePreview images={['a', 'b']} onRemove={onRemove} />);
    expect(screen.getByAltText('Ingredient photo 1')).toBeInTheDocument();
    expect(screen.getByAltText('Ingredient photo 2')).toBeInTheDocument();
  });

  it('calls onRemove with the correct index when × button is clicked', async () => {
    render(<ImagePreview images={fakeImages} onRemove={onRemove} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove photo/i });
    await userEvent.click(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('renders a remove button for every image', () => {
    render(<ImagePreview images={fakeImages} onRemove={onRemove} />);
    const buttons = screen.getAllByRole('button', { name: /remove photo/i });
    expect(buttons).toHaveLength(fakeImages.length);
  });

  it('renders no images and one "+" when images array is empty', () => {
    render(<ImagePreview images={[]} onRemove={onRemove} />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.getByText('+')).toBeInTheDocument();
  });
});
