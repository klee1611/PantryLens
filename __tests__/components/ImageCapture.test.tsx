import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageCapture from '@/components/ImageCapture';

const makeFile = (name = 'photo.jpg', type = 'image/jpeg') =>
  new File(['content'], name, { type });

describe('ImageCapture', () => {
  const onFiles = jest.fn();

  beforeEach(() => onFiles.mockClear());

  it('renders the drop zone and both action buttons', () => {
    render(<ImageCapture onFiles={onFiles} disabled={false} />);
    expect(screen.getByText('Drop photos here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /camera/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('disables both buttons when disabled prop is true', () => {
    render(<ImageCapture onFiles={onFiles} disabled={true} />);
    expect(screen.getByRole('button', { name: /camera/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
  });

  it('shows the max-images notice when disabled', () => {
    render(<ImageCapture onFiles={onFiles} disabled={true} />);
    expect(screen.getByText('Maximum 3 images added')).toBeInTheDocument();
  });

  it('does not show max-images notice when enabled', () => {
    render(<ImageCapture onFiles={onFiles} disabled={false} />);
    expect(screen.queryByText('Maximum 3 images added')).not.toBeInTheDocument();
  });

  it('calls onFiles with selected files from file input', async () => {
    render(<ImageCapture onFiles={onFiles} disabled={false} />);
    const [fileInput] = document.querySelectorAll('input[type="file"]');

    const file = makeFile();
    await userEvent.upload(fileInput as HTMLElement, file);

    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('calls onFiles when files are dropped onto the drop zone', () => {
    render(<ImageCapture onFiles={onFiles} disabled={false} />);
    const dropZone = screen.getByRole('button', { name: /drop photos here/i });

    const file = makeFile('drop.jpg');
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('does not call onFiles when disabled and files are dropped', () => {
    render(<ImageCapture onFiles={onFiles} disabled={true} />);
    // tabindex=-1 element: use querySelector to bypass role accessibility filters
    const dropZone = document.querySelector('[role="button"]')!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [makeFile()] },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('camera input has capture="environment" for native camera access', () => {
    render(<ImageCapture onFiles={onFiles} disabled={false} />);
    const cameraInput = document.querySelector('input[capture="environment"]');
    expect(cameraInput).toBeInTheDocument();
  });

  it('both file inputs accept image/* files only', () => {
    render(<ImageCapture onFiles={onFiles} disabled={false} />);
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((input) => {
      expect(input.getAttribute('accept')).toBe('image/*');
    });
  });
});
