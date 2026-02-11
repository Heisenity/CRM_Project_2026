import { prisma } from '../lib/prisma';
import { randomBytes } from 'crypto';
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
export class SessionService {
    // Create a new session
    async createSession(userId, userType, deviceInfo, ipAddress) {
        const sessionToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
        const sessionData = {
            sessionToken,
            userType,
            deviceInfo,
            ipAddress,
            expiresAt
        };
        // Set the appropriate foreign key based on user type
        if (userType === 'ADMIN') {
            sessionData.adminId = userId;
        }
        else {
            sessionData.employeeId = userId;
        }
        const session = await prisma.userSession.create({
            data: sessionData
        });
        return session;
    }
    // Get active sessions for a user
    async getActiveSessions(userId, userType) {
        const whereClause = {
            isActive: true,
            expiresAt: {
                gt: new Date()
            }
        };
        if (userType === 'ADMIN') {
            whereClause.adminId = userId;
        }
        else {
            whereClause.employeeId = userId;
        }
        return await prisma.userSession.findMany({
            where: whereClause,
            orderBy: {
                lastActivity: 'desc'
            }
        });
    }
    // Update session activity
    async updateSessionActivity(sessionToken) {
        return await prisma.userSession.update({
            where: { sessionToken },
            data: { lastActivity: new Date() }
        });
    }
    // Validate session
    async validateSession(sessionToken) {
        const session = await prisma.userSession.findUnique({
            where: { sessionToken },
            include: {
                admin: true,
                employee: true
            }
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return null;
        }
        const inactivityCutoff = new Date(Date.now() - SESSION_TIMEOUT_MS);
        if (session.lastActivity < inactivityCutoff) {
            await this.invalidateSession(sessionToken);
            return null;
        }
        // Update last activity
        await this.updateSessionActivity(sessionToken);
        return session;
    }
    // Invalidate a specific session
    async invalidateSession(sessionToken) {
        return await prisma.userSession.update({
            where: { sessionToken },
            data: { isActive: false }
        });
    }
    // Invalidate all sessions for a user (logout from all devices)
    async invalidateAllUserSessions(userId, userType) {
        const whereClause = {};
        if (userType === 'ADMIN') {
            whereClause.adminId = userId;
        }
        else {
            whereClause.employeeId = userId;
        }
        return await prisma.userSession.updateMany({
            where: whereClause,
            data: { isActive: false }
        });
    }
    // Clean up expired sessions
    async cleanupExpiredSessions() {
        return await prisma.userSession.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isActive: false }
                ]
            }
        });
    }
    // Get session count for user
    async getActiveSessionCount(userId, userType) {
        const whereClause = {
            isActive: true,
            expiresAt: { gt: new Date() }
        };
        if (userType === 'ADMIN') {
            whereClause.adminId = userId;
        }
        else {
            whereClause.employeeId = userId;
        }
        return await prisma.userSession.count({
            where: whereClause
        });
    }
}
export const sessionService = new SessionService();
