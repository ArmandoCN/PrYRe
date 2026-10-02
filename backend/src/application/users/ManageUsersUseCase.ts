import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../../infrastructure/database/prisma';

export class ManageUsersUseCase {
  async getUsers() {
    const users = await prisma.user.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        form_accesses: {
          select: { form_identifier: true }
        }
      }
    });
    return users.map(u => ({
      ...u,
      form_accesses: u.form_accesses.map(a => a.form_identifier)
    }));
  }

  async createUser(email: string, role: string, password_plain: string) {
    const password_hash = await bcrypt.hash(password_plain, 10);
    return await prisma.user.create({
      data: {
        email,
        role: role as any,
        password_hash
      },
      select: { id: true, email: true, role: true }
    });
  }

  async deleteUser(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { deleted_at: new Date() }
    });
  }

  async changePassword(userId: string, newPasswordPlain: string) {
    const password_hash = await bcrypt.hash(newPasswordPlain, 10);
    return await prisma.user.update({
      where: { id: userId },
      data: { password_hash }
    });
  }

  async updateUserRole(userId: string, role: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { role: role as any }
    });
  }

  async setFormAccess(userId: string, formIdentifiers: string[]) {
    // Delete all current accesses
    await prisma.userFormAccess.deleteMany({
      where: { user_id: userId }
    });
    // Create new ones
    if (formIdentifiers.length > 0) {
      await prisma.userFormAccess.createMany({
        data: formIdentifiers.map(form_identifier => ({
          user_id: userId,
          form_identifier
        }))
      });
    }
  }
}
