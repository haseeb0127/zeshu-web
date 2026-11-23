import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zeshu',
    short_name: 'Zeshu',
    description: 'Jagtial fast delivery and India-wide digital services.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FCFCF9',
    theme_color: '#FCFCF9',
    orientation: 'portrait-primary',
    categories: ['shopping', 'lifestyle'],
    // Installed Zeshu app: long-press its launcher icon on supported Android
    // devices for a direct link to the existing private admin-only Inbox.
    // No WhatsApp customer content, session token or account data in the manifest.
    shortcuts: [
      {
        name: 'Zeshu WhatsApp Inbox',
        short_name: 'WhatsApp Inbox',
        description: 'Open the private Zeshu WhatsApp admin Inbox',
        url: '/admin/whatsapp/inbox',
        icons: [
          { src: '/zeshu-glossy-icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
      },
    ],
    icons: [
      { src: '/zeshu-glossy-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/zeshu-glossy-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/zeshu-glossy-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
