import { describe, expect, it } from 'vitest';

import Video from '@/modules/Detail/components/Video';
import { renderWithProviders } from '@/test/test-utils';

describe('Video', () => {
  it('renders the bilibili player iframe with the correct src', () => {
    renderWithProviders(<Video bvid="BV1wEEg62EDP" aid={12345} cid={67890} />);
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute('src')).toContain(
      'aid=12345&bvid=BV1wEEg62EDP&cid=67890'
    );
  });

  it('applies the optional className', () => {
    const { container } = renderWithProviders(
      <Video
        bvid="BV1wEEg62EDP"
        aid={12345}
        cid={67890}
        className="custom-class"
      />
    );
    const iframe = container.querySelector('iframe');
    expect(iframe!.className).toContain('custom-class');
    expect(iframe!.className).toContain('aspect-video');
  });

  it('has sandbox and frameBorder attributes for security', () => {
    renderWithProviders(<Video bvid="BV1wEEg62EDP" aid={1} cid={1} />);
    const iframe = document.querySelector('iframe')!;
    expect(iframe.getAttribute('sandbox')).toBeTruthy();
    expect(iframe.getAttribute('frameBorder')).toBe('no');
  });
});
