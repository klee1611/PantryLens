import { compressToBase64 } from '@/lib/canvasCompress';

const originalCreateElement = document.createElement.bind(document);

function buildCanvasMock({
  ctxNull = false,
  blobNull = false,
}: { ctxNull?: boolean; blobNull?: boolean } = {}) {
  const ctx = ctxNull ? null : { drawImage: jest.fn() };
  const canvas: Record<string, unknown> = {
    _w: 0,
    _h: 0,
    getContext: jest.fn(() => ctx),
    toBlob: jest.fn((cb: (b: Blob | null) => void) =>
      cb(blobNull ? null : new Blob(['x'], { type: 'image/jpeg' })),
    ),
  };
  Object.defineProperty(canvas, 'width', {
    get() { return canvas._w; },
    set(v) { canvas._w = v; },
    configurable: true,
  });
  Object.defineProperty(canvas, 'height', {
    get() { return canvas._h; },
    set(v) { canvas._h = v; },
    configurable: true,
  });
  return canvas;
}

/**
 * New flow (iOS-safe):
 *   FileReader #1  readAsDataURL(file)  → onload({ target: { result: dataUrl } })
 *   Image           src = dataUrl        → onload()
 *   canvas.toBlob                        → blob
 *   FileReader #2  readAsDataURL(blob)  → onloadend, .result = base64Result
 */
function setupMocks({
  imgWidth = 800,
  imgHeight = 600,
  fileReaderError = false,  // FileReader #1 (reading the source file) errors
  loadError = false,         // Image fails to decode
  ctxNull = false,
  blobNull = false,
  outReaderError = false,   // FileReader #2 (reading the compressed blob) errors
  base64Result = 'data:image/jpeg;base64,MOCKEDBASE64',
  dataUrl = 'data:image/jpeg;base64,SOURCEDATA',
}: {
  imgWidth?: number;
  imgHeight?: number;
  fileReaderError?: boolean;
  loadError?: boolean;
  ctxNull?: boolean;
  blobNull?: boolean;
  outReaderError?: boolean;
  base64Result?: string;
  dataUrl?: string;
} = {}) {
  // Image mock: triggers onload/onerror when src is set
  global.Image = jest.fn(() => {
    const img: Record<string, unknown> = {
      width: imgWidth,
      height: imgHeight,
      onload: null,
      onerror: null,
    };
    Object.defineProperty(img, 'src', {
      set() {
        setTimeout(() => {
          if (loadError) (img.onerror as (() => void) | null)?.();
          else (img.onload as (() => void) | null)?.();
        }, 0);
      },
      configurable: true,
    });
    return img;
  }) as unknown as typeof Image;

  const mockCanvas = buildCanvasMock({ ctxNull, blobNull });

  jest.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'canvas'
      ? (mockCanvas as unknown as HTMLElement)
      : originalCreateElement(tag),
  );

  // FileReader mock: two instances created per compressToBase64 call.
  // #1 fires onload (source file → dataUrl), #2 fires onloadend (blob → base64).
  let callCount = 0;
  global.FileReader = jest.fn(() => {
    callCount++;
    const isFirst = callCount === 1;
    const fr: Record<string, unknown> = {
      result: isFirst ? dataUrl : base64Result,
      onload: null,
      onloadend: null,
      onerror: null,
    };
    fr.readAsDataURL = jest.fn(() => {
      setTimeout(() => {
        if (isFirst) {
          if (fileReaderError) {
            (fr.onerror as (() => void) | null)?.();
          } else {
            (fr.onload as ((e: { target: { result: string } }) => void) | null)?.({
              target: { result: dataUrl },
            });
          }
        } else {
          if (outReaderError) {
            (fr.onerror as (() => void) | null)?.();
          } else {
            (fr.onloadend as (() => void) | null)?.();
          }
        }
      }, 0);
    });
    return fr;
  }) as unknown as typeof FileReader;

  return { mockCanvas };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('compressToBase64', () => {
  it('returns only the base64 string without the data URI prefix', async () => {
    setupMocks({ base64Result: 'data:image/jpeg;base64,MOCKEDBASE64' });
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressToBase64(file);
    expect(result).toBe('MOCKEDBASE64');
    expect(result).not.toContain('data:image/jpeg;base64,');
  });

  it('does not resize images within the 1024px limit', async () => {
    const { mockCanvas } = setupMocks({ imgWidth: 800, imgHeight: 600 });
    const file = new File(['content'], 'small.jpg', { type: 'image/jpeg' });
    await compressToBase64(file);
    expect(mockCanvas._w).toBe(800);
    expect(mockCanvas._h).toBe(600);
  });

  it('resizes oversized landscape images to max 1024px wide', async () => {
    const { mockCanvas } = setupMocks({ imgWidth: 2048, imgHeight: 1024 });
    const file = new File(['content'], 'wide.jpg', { type: 'image/jpeg' });
    await compressToBase64(file);
    expect(mockCanvas._w).toBe(1024);
    expect(mockCanvas._h).toBe(512);
  });

  it('resizes oversized portrait images to max 1024px tall', async () => {
    const { mockCanvas } = setupMocks({ imgWidth: 768, imgHeight: 2048 });
    const file = new File(['content'], 'tall.jpg', { type: 'image/jpeg' });
    await compressToBase64(file);
    expect(mockCanvas._w).toBe(384);
    expect(mockCanvas._h).toBe(1024);
  });

  it('handles square images larger than 1024px', async () => {
    const { mockCanvas } = setupMocks({ imgWidth: 1500, imgHeight: 1500 });
    const file = new File(['content'], 'square.jpg', { type: 'image/jpeg' });
    await compressToBase64(file);
    expect(mockCanvas._w).toBe(1024);
    expect(mockCanvas._h).toBe(1024);
  });

  it('calls drawImage with the correct canvas dimensions', async () => {
    const { mockCanvas } = setupMocks({ imgWidth: 2048, imgHeight: 1024 });
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    await compressToBase64(file);
    const ctx = (mockCanvas.getContext as jest.Mock).mock.results[0].value;
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 512);
  });

  it('uses FileReader to read the source file (iOS-safe path)', async () => {
    setupMocks();
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    await compressToBase64(file);
    // FileReader should have been instantiated at least once (for the source file)
    expect(global.FileReader).toHaveBeenCalled();
  });

  it('rejects when the initial file read fails', async () => {
    setupMocks({ fileReaderError: true });
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressToBase64(file)).rejects.toThrow('Failed to read file');
  });

  it('rejects when the image fails to decode', async () => {
    setupMocks({ loadError: true });
    const file = new File(['content'], 'broken.jpg', { type: 'image/jpeg' });
    await expect(compressToBase64(file)).rejects.toThrow('Failed to decode image');
  });

  it('rejects when the canvas 2D context is unavailable', async () => {
    setupMocks({ ctxNull: true });
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressToBase64(file)).rejects.toThrow('Canvas 2D context not available');
  });

  it('rejects when canvas.toBlob returns null', async () => {
    setupMocks({ blobNull: true });
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressToBase64(file)).rejects.toThrow('Image compression failed');
  });

  it('rejects when the output FileReader errors', async () => {
    setupMocks({ outReaderError: true });
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressToBase64(file)).rejects.toThrow('Failed to encode result');
  });
});
