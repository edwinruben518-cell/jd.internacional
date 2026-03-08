'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { bsc } from '@reown/appkit/networks'
import { ReactNode } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

const ethersAdapter = new EthersAdapter()

createAppKit({
  adapters: [ethersAdapter],
  networks: [bsc],
  metadata: {
    name: 'JD Internacional',
    description: 'Pagos con USDT BEP-20',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://jdinternacional.com',
    icons: [],
  },
  projectId,
  features: { analytics: false },
})

export function WalletProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
