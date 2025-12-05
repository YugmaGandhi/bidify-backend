import { prisma } from '../../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

    // 3. Create User
    const user = await prisma.user.create({
        data: {
            email: input.email,
            name: input.name,
            password: hashedPassword,
        },
    });

    // 4. Generate Token
    const token = jwt.sign(
        { userId: user.id, role: 'USER' }, // Payload
        process.env.JWT_SECRET as string,  // Secret
        { expiresIn: '7d' }                // Expiry
    );

    // 5. Return user (without password) and token
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
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