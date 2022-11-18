import * as React from 'react'
import { init_env, SwapWidget, Transaction } from '@ref-finance/ref-sdk'
import { NotLoginError } from '@ref-finance/ref-sdk'
import { useNearProvider } from 'hooks/useNearProvider'
import near from 'services/near'
import Modal from 'components/Common/Modal'
import { Theme } from '@ref-finance/ref-sdk/dist/swap-widget/constant'
import { parseTransactionRef } from 'utils/common'
import { useState, useEffect } from 'react'

export const defaultDarkModeTheme: Theme = {
	container: '#26343E',
	buttonBg: '#00C6A2',
	primary: '#FFFFFF',
	secondary: '#7E8A93',
	borderRadius: '4px',
	fontFamily: 'sans-serif',
	hover: 'rgba(126, 138, 147, 0.2)',
	active: 'rgba(126, 138, 147, 0.2)',
	secondaryBg: 'rgba(0, 0, 0, 0.2)',
	borderColor: 'rgba(126, 138, 147, 0.2)',
	iconDefault: '#7E8A93',
	iconHover: '#B7C9D6',
	refIcon: 'white',
}

init_env(process.env.NEXT_PUBLIC_APP_ENV || 'testnet')

interface SwapWidgetProps {
	show: boolean
	setShowSwapModal: (show: boolean) => void
	onClose: () => void
}

export const Widget = (props: SwapWidgetProps) => {
	const { accountId } = useNearProvider()

	const [swapState, setSwapState] = useState<'success' | 'fail' | null>(null)
	const [tx, setTx] = useState<string | undefined>(undefined)

	useEffect(() => {
		const errorCode = new URLSearchParams(window.location.search).get('errorCode')

		const transactions = new URLSearchParams(window.location.search).get('transactionHashes')

		const lastTX = transactions?.split(',').pop()

		setTx(lastTX)

		if (lastTX) {
			props.setShowSwapModal(true)
		}

		setSwapState(errorCode ? 'fail' : lastTX ? 'success' : null)

		window.history.replaceState({}, '', window.location.origin + window.location.pathname)
	}, [])

	const onSwap = async (transactionsRef: Transaction[]) => {
		if (!accountId) throw NotLoginError

		if (transactionsRef && transactionsRef !== null) {
			const parsedTransactionRef: Transaction[] = parseTransactionRef(transactionsRef)
			near.executeMultipleTransactions(parsedTransactionRef as any)
		}
	}

	const onConnect = () => {
		near.signIn()
	}

	const onDisConnect = async () => {
		near.signOut()
	}

	return (
		<Modal isShow={props.show} onClose={props.onClose} closeOnEscape={true} closeOnBgClick={true}>
			<SwapWidget
				theme={defaultDarkModeTheme}
				onSwap={onSwap}
				onDisConnect={onDisConnect}
				width={'400px'}
				connection={{
					AccountId: accountId || '',
					isSignedIn: near.wallet.isSignedIn(),
				}}
				transactionState={{
					state: swapState,
					setState: setSwapState,
					tx,
				}}
				enableSmartRouting={true}
				onConnect={onConnect}
				defaultTokenIn={process.env.NEXT_PUBLIC_WRAP_NEAR_CONTRACT}
				defaultTokenOut={process.env.NEXT_PUBLIC_PARAS_TOKEN_CONTRACT}
				className="mx-auto"
			/>
		</Modal>
	)
}

export default Widget
