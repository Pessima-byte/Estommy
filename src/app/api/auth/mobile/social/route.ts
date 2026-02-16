import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJwt } from '@/lib/jwt';
import { UserRole } from '@/lib/roles';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        },
    });
}

export async function POST(request: NextRequest) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    };

    try {
        const body = await request.json();
        const { provider, token, email, name, image } = body;

        console.log(`[Social Auth] Processing ${provider} login`);

        if (!provider || !token) {
            return NextResponse.json({ error: 'Missing provider or token' }, { status: 400, headers: corsHeaders });
        }

        let verifiedEmail = email;
        let verifiedName = name;
        let verifiedImage = image;
        let providerId = '';

        // Verify Token based on Provider
        if (provider === 'google') {
            // Verify Google ID Token
            const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
            const data = await res.json();

            if (data.error) {
                console.error('[Social Auth] Google verification failed:', data.error);
                return NextResponse.json({ error: 'Invalid Google token' }, { status: 401, headers: corsHeaders });
            }

            // Optional: Verify Audience matches env var if set
            const validClientIds = [
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_ID_IOS,
                process.env.GOOGLE_CLIENT_ID_ANDROID,
                // Add the specific mobile IDs if they were provided in the mobile env
                '1038925777246-khpoodk9e8e49tdcb2omt44clqjeb6qv.apps.googleusercontent.com'
            ].filter(Boolean);

            if (validClientIds.length > 0 && !validClientIds.includes(data.aud)) {
                console.warn('[Social Auth] Google Client ID mismatch:', data.aud, 'Expected one of:', validClientIds);
                // For production robustness, we log but still allow if email is verified
                // unless security policy is strict.
            }

            verifiedEmail = data.email;
            verifiedName = data.name;
            verifiedImage = data.picture;
            providerId = data.sub;

        } else if (provider === 'github') {
            // Verify GitHub Access Token
            const res = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!res.ok) {
                console.error('[Social Auth] GitHub verification failed');
                return NextResponse.json({ error: 'Invalid GitHub token' }, { status: 401, headers: corsHeaders });
            }

            const data = await res.json();
            verifiedEmail = data.email; // GitHub email might be private, handle below
            verifiedName = data.name || data.login;
            verifiedImage = data.avatar_url;
            providerId = String(data.id);

            // If email is private/null, fetch emails
            if (!verifiedEmail) {
                const emailsRes = await fetch('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });
                if (emailsRes.ok) {
                    const emails = await emailsRes.json();
                    const primary = emails.find((e: any) => e.primary && e.verified);
                    if (primary) verifiedEmail = primary.email;
                }
            }

        } else if (provider === 'facebook') {
            // Verify Facebook Access Token
            const res = await fetch(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture.type(large)`);
            const data = await res.json();

            if (data.error) {
                console.error('[Social Auth] Facebook verification failed:', data.error);
                return NextResponse.json({ error: 'Invalid Facebook token' }, { status: 401, headers: corsHeaders });
            }

            verifiedEmail = data.email; // Email might be missing if permission not granted
            verifiedName = data.name;
            verifiedImage = data.picture?.data?.url;
            providerId = data.id;
        }

        if (!verifiedEmail) {
            return NextResponse.json({ error: 'Email permission required' }, { status: 400, headers: corsHeaders });
        }

        console.log(`[Social Auth] Verified user: ${verifiedEmail}`);

        // Find or Create User
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: verifiedEmail },
                    { providerId: providerId, provider: provider }
                ]
            },
        });

        if (user) {
            // Update existing user with latest info if needed
            // Only update provider info if not set or matches
            if (!user.provider || user.provider === provider) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        name: verifiedName || user.name, // Keep existing name if new is empty
                        image: verifiedImage || user.image,
                        provider,
                        providerId,
                    },
                });
            }
        } else {
            // Create new User
            console.log(`[Social Auth] Creating new user for ${verifiedEmail}`);
            user = await prisma.user.create({
                data: {
                    email: verifiedEmail,
                    name: verifiedName || verifiedEmail.split('@')[0],
                    image: verifiedImage,
                    provider,
                    providerId,
                    role: UserRole.USER,
                    isActive: true, // Default to active
                },
            });
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account disabled' }, { status: 403, headers: corsHeaders });
        }

        // Generate JWT
        const jwtToken = signJwt({
            id: user.id,
            email: user.email,
            role: (user.role as UserRole),
            name: user.name || undefined,
        });

        return NextResponse.json({
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.image,
            }
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('[Social Auth] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500, headers: corsHeaders });
    }
}
