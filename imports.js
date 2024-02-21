import { Buffer } from 'buffer'
window.Buffer = Buffer// require('buffer').Buffer;

const  {TonClient,TonClient4, Address, fromNano} = await import('@ton/ton')
const {getHttpEndpoint} = await import('@orbs-network/ton-access')


window.TonClient =TonClient // require('@ton/ton').TonClient;
window.TonClient4 =TonClient4 // require('@ton/ton').TonClient;
window.getHttpEndpoint = getHttpEndpoint// require('@orbs-network/ton-access').getHttpEndpoint;
window.Address = Address// require('@ton/ton').Address;
window.fromNano = fromNano// require('@ton/ton').fromNano;
