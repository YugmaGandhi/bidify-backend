import { prisma } from '../../config/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../common/utils/email';

// Define the input type
interface RegisterInput {
    email: string;
    name: string;
    password: string;
}

// Define Login Input
interface LoginInput {
    email: string;
    password: string;
}

export const registerUser = async (input: RegisterInput) => {
    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    // 2. Hash password (10 rounds is standard)
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 2.5 Generate random token
    const generatedVerificationToken = crypto.randomBytes(32).toString('hex');

    // 3. Create User
    const user = await prisma.user.create({
        data: {
            email: input.email,
            name: input.name,
            password: hashedPassword,
            verificationToken: generatedVerificationToken,
        },
    });

    // In real frontend, this URL would be: https://your-frontend.com/verify?token=...
    const verificationUrl = `http://localhost:3000/api/v1/auth/verify-email?token=${generatedVerificationToken}`;
    
    await sendEmail(
        user.email, 
        'Verify your Email', 
        `<h1>Welcome to Bidify!</h1>
         <p>Please click the link below to verify your account:</p>
         <a href="${verificationUrl}">Verify Email</a>`
    );

    // 4. Generate Token
    const token = jwt.sign(
        { userId: user.id, role: 'USER' }, // Payload
        process.env.JWT_SECRET as string,  // Secret
        { expiresIn: '7d' }                // Expiry
    );

    // 5. Return user (without password) and token
    const { password, verificationToken, ...userWithoutPasswordAndEmailToken } = user;
    return { user: userWithoutPasswordAndEmailToken, token };
};

export const loginUser = async ( input: LoginInput) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if(!user) {
        throw new Error('Invalid email or password');
    }

    // Verify Password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if(!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // Generate Token
    const token = jwt.sign(
        { userId: user.id, role: 'USER' }, //Default role USER for now
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }                // Expiry
    );

    // Return user info
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
}

// NEW FUNCTION: Handle the click
export const verifyUserEmail = async (token: string) => {
    // 1. Find user with this token
    const user = await prisma.user.findFirst({
        where: { verificationToken: token }
    });

    if (!user) {
        throw new Error('Invalid or expired verification token');
    }

    // 2. Update User
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationToken: null // Clear the token so it can't be used again
        }
    });

    return true;
};