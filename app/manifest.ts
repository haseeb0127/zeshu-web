import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zeshu',
    short_name: 'Zeshu',
    description: 'Jagtial fast delivery and India-wide digital services.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F9F5',
    theme_color: '#0B6F47',
    orientation: 'portrait-primary',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/zeshu-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/zeshu-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
