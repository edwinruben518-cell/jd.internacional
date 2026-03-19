/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Todos los paquetes que Baileys usa con código nativo de Node.js
    experimental: {
        instrumentationHook: true,
        serverComponentsExternalPackages: [
            '@whiskeysockets/baileys',
            'pino',
            'pino-pretty',
            'ws',
            'bufferutil',
            'utf-8-validate',
            '@hapi/boom',
            'noise-handshake',
            'libsignal',
            'get-port',
        ],
    },

    webpack: (config, { isServer }) => {
        if (isServer) {
            // Forzar que estos módulos sean tratados como externos aunque webpack los vea
            const nativeModules = [
                'bufferutil',
                'utf-8-validate',
                'ws',
                '@whiskeysockets/baileys',
                'pino',
            ]
            config.externals = [
                ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
                ...nativeModules,
            ]
        }
        return config
    },
}

module.exports = nextConfig
