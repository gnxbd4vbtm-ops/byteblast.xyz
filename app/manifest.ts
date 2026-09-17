import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.brandName,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#090b12',
    theme_color: '#0b1020',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
