import axios from 'axios'
import { LogoBounce } from 'components/Common/Loader'
import Modal from 'components/Common/Modal'
import NFTokenFarm from 'components/Common/NFTokenFarm'
import IconBack from 'components/Icon/IconBack'
import { apiParasUrl } from 'constants/apiURL'
import { GAS_FEE } from 'constants/gasFee'
import { useNearProvider } from 'hooks/useNearProvider'
import { ModalCommonProps } from 'interfaces/modal'
import { INFToken } from 'interfaces/token'
import { useEffect, useState } from 'react'
import near, { CONTRACT } from 'services/near'

interface UnstakeNFTModalProps extends ModalCommonProps {}

interface stakedResponse {
	[key: string]: string[]
}

const UnstakeNFTModal = (props: UnstakeNFTModalProps) => {
	const [stakedNFT, setStakedNFT] = useState<INFToken[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { accountId } = useNearProvider()

	useEffect(() => {
		const getStakedNFT = async () => {
			stakedNFT.length === 0 && setIsLoading(true)
			if (accountId) {
				const resSC: stakedResponse = await near.nearViewFunction({
					contractName: CONTRACT.FARM,
					methodName: 'list_user_nft_seeds',
					args: {
						account_id: accountId,
					},
				})

				if (resSC[props.seedId]) {
					const resBE: INFToken[] = await axios.all(resSC[props.seedId].map(fetchToken))
					setStakedNFT(resBE)
				}
			}
			setIsLoading(false)
		}

		const fetchToken = (scNft: string) => {
			const [contract_id, token_id] = scNft.split('@')
			const params = { token_id, contract_id }
			return axios
				.get(`${apiParasUrl}/token`, { params })
				.then((response) => response.data.data.results[0])
				.catch((error) => error)
		}

		if (props.show) {
			getStakedNFT()
		}
	}, [accountId, props.seedId, props.show, stakedNFT.length])

	const unstakeNFT = (tokenId: string, contractId: string) => {
		near.nearFunctionCall({
			contractName: CONTRACT.FARM,
			methodName: 'withdraw_nft',
			args: {
				seed_id: props.seedId,
				nft_contract_id: contractId,
				nft_token_id: tokenId,
			},
			amount: '1',
			gas: GAS_FEE[300],
		})
	}

	return (
		<Modal isShow={props.show} onClose={props.onClose}>
			<div className="max-w-sm md:max-w-2xl w-full bg-parasGrey p-4 rounded-lg m-auto shadow-xl">
				<div className="flex items-center mb-4">
					<div className="w-1/5">
						<div className="inline-block cursor-pointer" onClick={props.onClose}>
							<IconBack />
						</div>
					</div>
					<div className="w-3/5 flex-1 text-center">
						<p className="font-bold text-xl text-white">Unstake NFT</p>
						<p className="text-white text-sm -mt-1">{props.title}</p>
					</div>
					<div className="w-1/5" />
				</div>

				{isLoading ? (
					<div className="w-full h-[50vh] md:h-[60vh] flex flex-col items-center justify-center">
						<LogoBounce width={20} className="mb-4 opacity-50" />
					</div>
				) : (
					<div className="h-[50vh] md:h-[60vh] overflow-y-scroll no-scrollbar">
						{stakedNFT.length !== 0 ? (
							<div className="md:grid md:grid-cols-2 md:gap-4">
								{stakedNFT.map((nft) => (
									<NFTokenFarm key={nft._id} token={nft} stakeNFT={unstakeNFT} type="unstake" />
								))}
							</div>
						) : (
							<div className="w-full h-full flex items-center justify-center px-4 text-center">
								<p>{"You haven't stake any NFT for this Pool"}</p>
							</div>
						)}
					</div>
				)}
			</div>
		</Modal>
	)
}

export default UnstakeNFTModal
