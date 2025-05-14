import { Devvit } from '@devvit/public-api';
import * as QR from 'qrcode'
import * as jose from 'jose'

Devvit.configure({ redditAPI: true, media: true })
Devvit.addSettings({ scope: 'app', type: 'string', name: 'jwk', label: 'secret signing jwk', isSecret: true })
Devvit.addMenuItem({
  location: 'subreddit',
  label: 'Claim Verifiable Credential',
  onPress: async (event, context) => {
    const user = await context.reddit.getCurrentUser()
    if (user) {
      const subRedditName = (await context.reddit.getCurrentSubredditName());
      if (subRedditName) {
        const jwk = JSON.parse((await context.settings.get('jwk'))! as string)

        const credentialOffer = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(
          {
            "credential_issuer": "https://reddit-ssi.vercel.app",
            "credential_configuration_ids": ["SubredditMembership_jwt_vc_json"],
            "grants": {
              "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
                "pre-authorized_code": await new jose.SignJWT({ subreddit: subRedditName, username: user.username, linkKarma: user.linkKarma, commentKarma: user.commentKarma, createdAt: user.createdAt })
                  .setIssuer(context.appName)
                  .setExpirationTime('15 minutes')
                  .setSubject(context.userId!)
                  .setProtectedHeader({ alg: 'EdDSA' })
                  .sign(await jose.importJWK(jwk))
              }
            }
          }
        ))}`
        const q = await QR.toBuffer(credentialOffer, { errorCorrectionLevel: 'low' })
        const ul = await context.media.upload({ url: `data:image/png;base64,${q.toString('base64')}`, type: 'image' })
        await context.reddit.sendPrivateMessage({
          to: `u/${user.username}`,
          //fromSubredditName: subRedditName,
          subject: `Your SSI credential for r/${subRedditName}`,
          text: `
Hello ${user.username},

You have requested an SSI verifiable credential for the r/${subRedditName} subreddit.

To claim your credential, scan this QR Code with your SSI-Wallet: ${ul.mediaUrl}

Alternatively, paste this credential offer code to your wallet:
\`\`\`
${credentialOffer}
\`\`\`

Your credential offer is valid for 15 minutes.`.trim()
        })
        context.ui.showToast('Message sent! Check your inbox.');
      }
    }
  },
});

export default Devvit;
