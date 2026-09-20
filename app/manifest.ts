import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zeshu',
    short_name: 'Zeshu',
    description: 'Jagtial fast delivery and India-wide digital services.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8F9FC',
    theme_color: '#087443',
    orientation: 'portrait-primary',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/zeshu-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
}
