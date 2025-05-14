import * as jose from 'jose'

const {publicKey, privateKey} = await jose.generateKeyPair('EdDSA', {extractable:true})

// Export as JWK (private)
const privateJwk = await jose.exportJWK(privateKey)

// Export as JWK (public)
const publicJwk = await jose.exportJWK(publicKey)

// Add metadata
const alg = 'EdDSA'
const kid = await jose.calculateJwkThumbprint(publicJwk)

Object.assign(privateJwk, { alg, use: 'sig', kid })
Object.assign(publicJwk, { alg, use: 'sig', kid })

console.log('Private JWK:', JSON.stringify(privateJwk))
console.log('Public JWK:', JSON.stringify(publicJwk))