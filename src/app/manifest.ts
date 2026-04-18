import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'JADE AI',
        short_name: 'JD INTER',
        description: 'Plataforma Oficial - JADE AI',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#00F3FF',
        icons: [
            {
                src: '/logo.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
