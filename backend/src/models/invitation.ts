import { query } from '../database/db';

export async function createInvitation(email: string, name: string | null, invitedBy: number, tokenHash: string, expiresAt: Date) {
    const sql = `
        INSERT INTO admin_invitations (email, name, invited_by, token_hash, expires_at, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
        ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            invited_by = VALUES(invited_by),
            token_hash = VALUES(token_hash),
            expires_at = VALUES(expires_at),
            status = 'pending'
    `;
    const result = await query(sql, [email.toLowerCase().trim(), name, invitedBy, tokenHash, expiresAt]);
    return result;
}

export async function getInvitationByEmail(email: string) {
    const rows = await query<any[]>('SELECT * FROM admin_invitations WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
    return rows[0];
}

export async function getAllInvitations() {
    const sql = `
        SELECT ai.*, u.name as inviter_name, u.email as inviter_email
        FROM admin_invitations ai
        LEFT JOIN users u ON ai.invited_by = u.id
        ORDER BY ai.created_at DESC
    `;
    return await query<any[]>(sql);
}

export async function acceptInvitation(email: string) {
    return await query(
        "UPDATE admin_invitations SET status = 'accepted', accepted_at = NOW() WHERE LOWER(email) = ? AND status = 'pending'",
        [email.toLowerCase().trim()]
    );
}

export async function revokeInvitation(id: number | string) {
    return await query(
        "UPDATE admin_invitations SET status = 'revoked' WHERE id = ?",
        [id]
    );
}

export async function getAdminOverview() {
    const [totalAdminsRows] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'super_admin')");
    const [activeAdminsRows] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'");
    const [inactiveAdminsRows] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'super_admin') AND status = 'inactive'");
    const [superAdminCountRows] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'");
    const [pendingInvitesRows] = await query<any[]>("SELECT COUNT(*) as count FROM admin_invitations WHERE status = 'pending'");
    
    const admins = await query<any[]>(`
        SELECT id, name, email, role, google_id, picture, status, created_at, last_login 
        FROM users 
        WHERE role IN ('admin', 'super_admin')
        ORDER BY FIELD(role, 'super_admin', 'admin'), created_at DESC
    `);

    const invitations = await getAllInvitations();

    return {
        totalAdmins: totalAdminsRows ? totalAdminsRows.count : 0,
        activeAdmins: activeAdminsRows ? activeAdminsRows.count : 0,
        inactiveAdmins: inactiveAdminsRows ? inactiveAdminsRows.count : 0,
        superAdminCount: superAdminCountRows ? superAdminCountRows.count : 0,
        pendingInvitations: pendingInvitesRows ? pendingInvitesRows.count : 0,
        admins,
        invitations
    };
}

