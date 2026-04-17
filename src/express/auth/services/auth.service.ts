import { randomUUID } from 'node:crypto';
import bcryptjs from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';

type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT';

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

const usersById = new Map<string, UserRecord>();
const usersByEmail = new Map<string, UserRecord>();

const getJwtSecret = () => process.env.JWT_SECRET || 'default_secret_key';
const getJwtExpiresIn = (): SignOptions['expiresIn'] =>
  (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

export const validateUserCredentials = async (
  email: string,
  password: string,
) => {
  const user = usersByEmail.get(email.toLowerCase());
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('INVALID_PASSWORD');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  phone?: string,
) => {
  const emailKey = email.toLowerCase();
  if (usersByEmail.has(emailKey)) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const passwordHash = await bcryptjs.hash(password, 10);

  const user: UserRecord = {
    id,
    name,
    email: emailKey,
    phone: phone || null,
    role: 'PATIENT',
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  usersById.set(id, user);
  usersByEmail.set(emailKey, user);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
};

export const logout = async () => ({ success: true });

export const recoverPassword = async (email: string) => {
  const user = usersByEmail.get(email.toLowerCase());
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  return { email, success: true };
};

export const getProfile = async (userId: string) => {
  const user = usersById.get(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};
