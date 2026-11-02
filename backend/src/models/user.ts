import { query } from '../database/db';

export interface UserRecord {
    id: number;
    name: string;
    email: string;
    password?: string;
    role: 'super_admin' | 'admin' | 'user';
    google_id?: string | null;
    picture?: string | null;
    auth_provider?: string;
    email_verified?: boolean;
    status: 'active' | 'inactive';
    created_at?: string;
    last_login?: string | null;
    total_orders?: number;
}

export async function getAllUsers(): Promise<UserRecord[]> {
    const sql = `
        SELECT u.id, u.name, u.email, u.role, u.google_id, u.picture, u.auth_provider, u.email_verified, u.status, u.created_at, u.last_login, COUNT(o.id) as total_orders
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.name, u.email, u.role, u.google_id, u.picture, u.auth_provider, u.email_verified, u.status, u.created_at, u.last_login
        ORDER BY u.id ASC
    `;
    return await query<UserRecord[]>(sql);
}

export async function getUserById(id: number | string): Promise<UserRecord | undefined> {
    const rows = await query<UserRecord[]>(
        'SELECT id, name, email, role, google_id, picture, auth_provider, email_verified, status, created_at, last_login FROM users WHERE id = ?', 
        [id]
    );
    return rows[0];
}

export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
    const rows = await query<UserRecord[]>('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
    return rows[0];
}

export async function getUserByGoogleId(googleId: string): Promise<UserRecord | undefined> {
    const rows = await query<UserRecord[]>('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return rows[0];
}

export async function createUser(
    name: string,
    email: string,
    password?: string | null,
    role: string = 'user',
    googleId: string | null = null,
    picture: string | null = null,
    authProvider: string = 'local',
    emailVerified: boolean = false
): Promise<number> {
    const result: any = await query(
        `INSERT INTO users (name, email, password, role, google_id, picture, auth_provider, email_verified, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [name, email.toLowerCase().trim(), password || null, role, googleId, picture, authProvider, emailVerified]
    );
    return result.insertId;
}

export async function linkGoogleAccount(userId: number, googleId: string, picture: string | null) {
    return await query(
        `UPDATE users 
         SET google_id = COALESCE(google_id, ?), 
             picture = COALESCE(picture, ?),
             auth_provider = CASE WHEN auth_provider = 'local' THEN 'google' ELSE auth_provider END,
             email_verified = TRUE 
         WHERE id = ?`,
        [googleId, picture, userId]
    );
}

export async function updateUserRole(userId: number, role: string) {
    return await query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
}

export async function updateUserStatus(userId: number, status: string) {
    return await query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
}

export async function updateLastLogin(userId: number) {
    return await query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
}

export async function updateProfile(userId: number, name: string, email: string, password?: string) {
    if (password && password.trim()) {
        return await query(
            'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
            [name.trim(), email.toLowerCase().trim(), password, userId]
        );
    }
    return await query(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name.trim(), email.toLowerCase().trim(), userId]
    );
}

export async function deleteUser(userId: number) {
    return await query('DELETE FROM users WHERE id = ?', [userId]);
}

export async function getActiveSuperAdminCount(): Promise<number> {
    const rows = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND status = 'active'");
    return rows[0] ? rows[0].count : 0;
}

export async function checkPassword(plain: string, stored: string): Promise<boolean> {
    return plain === stored;
}

