'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'

const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'
const DEFAULT_RECEIVER = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER ?? ''

const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
]

type Step = 'connect' | 'pay' | 'processing' | 'success' | 'error'

interface PaymentGatewayProps {
  plan: string
  price: number
  receiverAddress?: string
  onSubmitPayment?: (txHash: string) => Promise<'approved' | 'pending_verification'>
  onSuccess?: (status: 'approved' | 'pending_verification') => void
  onCancel?: () => void
}

export function PaymentGateway({ plan, price, receiverAddress: receiverProp, onSubmitPayment, onSuccess, onCancel }: PaymentGatewayProps) {
  const receiverAddress = (receiverProp ?? DEFAULT_RECEIVER).toLowerCase()

  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')

  const [step, setStep] = useState<Step>('connect')
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingBalance, setLoadingBalance] = useState(false)

  async function handleConnect() {
    await open()
    // Después de abrir el modal, el usuario conecta su wallet
    // useAppKitAccount se actualiza automáticamente
  }

  async function fetchBalance(addr: string) {
    setLoadingBalance(true)
    try {
      const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org')
      const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider)
      const raw = await contract.balanceOf(addr)
      setUsdtBalance(Number(ethers.formatUnits(raw, 18)))
    } catch {
      setUsdtBalance(null)
    } finally {
      setLoadingBalance(false)
    }
  }

  // Cuando la wallet se conecta, pasamos al step de pago
  async function proceedToPay() {
    if (!isConnected || !address) {
      await open()
      return
    }
    setStep('pay')
    await fetchBalance(address)
  }

  async function sendPayment() {
    if (!walletProvider || !address) return

    try {
      setStep('processing')
      const provider = new ethers.BrowserProvider(walletProvider as any)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, signer)

      const amount = ethers.parseUnits(price.toFixed(2), 18)
      const tx = await contract.transfer(receiverAddress, amount)

      setTxHash(tx.hash)

      let status: 'approved' | 'pending_verification'

      if (onSubmitPayment) {
        status = await onSubmitPayment(tx.hash)
      } else {
        const res = await fetch('/api/pack-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, paymentMethod: 'CRYPTO', txHash: tx.hash }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al registrar el pago')
        status = data.status === 'approved' ? 'approved' : 'pending_verification'
      }

      setStep('success')
      onSuccess?.(status)
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Error al procesar el pago')
      setStep('error')
    }
  }

  const planLabel = { BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }[plan] ?? plan
  const btn = 'w-full py-3 rounded-xl font-bold text-sm transition-all'

  return (
    <div className="flex flex-col gap-4">
      {/* Info del pago */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">₮</span>
        <div>
          <p className="text-white font-bold">{planLabel}</p>
          <p className="text-yellow-400 font-bold text-lg">{price.toFixed(2)} USDT</p>
          <p className="text-xs text-dark-400">Red: BNB Smart Chain (BEP-20)</p>
        </div>
      </div>

      {/* Step: Conectar wallet */}
      {step === 'connect' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-dark-300 text-center">
            Conecta tu wallet para pagar con USDT
          </p>

          {!isConnected ? (
            <button onClick={handleConnect} className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black`}>
              🔗 Conectar Wallet
            </button>
          ) : (
            <>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-dark-400">Wallet conectada</p>
                <p className="text-xs text-white font-mono truncate">{address}</p>
              </div>
              <button onClick={proceedToPay} className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black`}>
                Continuar al pago →
              </button>
            </>
          )}

          {onCancel && (
            <button onClick={onCancel} className={`${btn} bg-white/5 text-dark-400 hover:bg-white/10`}>
              Cancelar
            </button>
          )}
        </div>
      )}

      {/* Step: Pagar */}
      {step === 'pay' && address && (
        <div className="flex flex-col gap-3">
          <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-xs text-dark-400">Wallet conectada</p>
            <p className="text-xs text-white font-mono truncate">{address}</p>
            <p className="text-xs text-dark-400 mt-1">
              Balance USDT:{' '}
              {loadingBalance ? '...' : usdtBalance !== null ? `${usdtBalance.toFixed(2)} USDT` : 'No disponible'}
            </p>
          </div>

          {usdtBalance !== null && usdtBalance < price && (
            <p className="text-xs text-red-400 text-center">
              ⚠️ Balance insuficiente. Necesitas {price.toFixed(2)} USDT, tienes {usdtBalance.toFixed(2)} USDT.
            </p>
          )}

          <button
            onClick={sendPayment}
            disabled={usdtBalance !== null && usdtBalance < price}
            className={`${btn} bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            ₮ Pagar {price.toFixed(2)} USDT
          </button>
          {onCancel && (
            <button onClick={onCancel} className={`${btn} bg-white/5 text-dark-400 hover:bg-white/10`}>
              Cancelar
            </button>
          )}
        </div>
      )}

      {/* Step: Procesando */}
      {step === 'processing' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
          <p className="text-sm text-dark-300 text-center">
            {txHash ? 'Verificando en la blockchain...' : 'Confirmando en tu wallet...'}
          </p>
          {txHash && (
            <a
              href={`https://bscscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-400 underline"
            >
              Ver en BSCScan ↗
            </a>
          )}
        </div>
      )}

      {/* Step: Éxito */}
      {step === 'success' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <span className="text-4xl">✅</span>
          <p className="text-white font-bold text-center">¡Pago enviado correctamente!</p>
          <p className="text-xs text-dark-400 text-center">
            Tu plan será activado en minutos una vez confirmado en la red.
          </p>
          {txHash && (
            <a
              href={`https://bscscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-400 underline"
            >
              Ver transacción en BSCScan ↗
            </a>
          )}
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          </div>
          <button onClick={() => setStep('connect')} className={`${btn} bg-white/5 text-dark-300 hover:bg-white/10`}>
            Reintentar
          </button>
          {onCancel && (
            <button onClick={onCancel} className={`${btn} bg-white/5 text-dark-400 hover:bg-white/10`}>
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
