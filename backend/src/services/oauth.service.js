const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config/server.config');

class OAuthService {
    constructor() {
        this.googleClient = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.FRONTEND_URL}/auth/google/callback`
        );
    }

    async verifyGoogleToken(token) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            return {
                email: payload.email,
                firstName: payload.given_name,
                lastName: payload.family_name,
                avatar: payload.picture,
                provider: 'google',
                providerId: payload.sub,
                isEmailVerified: payload.email_verified
            };
        } catch (error) {
            console.error('Error verifying Google token:', error);
            throw new Error('Invalid Google token');
        }
    }

    async getGithubUserData(code) {
        try {
            // 1. Scambia il codice per un access token
            const tokenResponse = await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                },
                {
                    headers: { Accept: 'application/json' }
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // 2. Usa l'access token per ottenere i dati dell'utente
            const userResponse = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            // 3. Ottieni l'email dell'utente (potrebbe essere privata)
            const emailsResponse = await axios.get('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const primaryEmail = emailsResponse.data.find(email => email.primary);

            return {
                email: primaryEmail.email,
                firstName: userResponse.data.name ? userResponse.data.name.split(' ')[0] : '',
                lastName: userResponse.data.name ? userResponse.data.name.split(' ').slice(1).join(' ') : '',
                avatar: userResponse.data.avatar_url,
                provider: 'github',
                providerId: userResponse.data.id.toString(),
                isEmailVerified: primaryEmail.verified
            };
        } catch (error) {
            console.error('Error getting GitHub user data:', error);
            throw new Error('Failed to authenticate with GitHub');
        }
    }

    generateAuthUrl(provider) {
        switch (provider) {
            case 'google':
                return this.googleClient.generateAuthUrl({
                    access_type: 'offline',
                    scope: [
                        'https://www.googleapis.com/auth/userinfo.profile',
                        'https://www.googleapis.com/auth/userinfo.email'
                    ]
                });
            case 'github':
                const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
                githubAuthUrl.searchParams.append('client_id', process.env.GITHUB_CLIENT_ID);
                githubAuthUrl.searchParams.append('scope', 'user:email');
                return githubAuthUrl.toString();
            default:
                throw new Error('Invalid OAuth provider');
        }
    }
}

module.exports = new OAuthService();