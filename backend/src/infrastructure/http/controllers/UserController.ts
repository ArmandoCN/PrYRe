import { Request, Response } from 'express';
import { ManageUsersUseCase } from '../../../application/users/ManageUsersUseCase';

export class UserController {
  constructor(private manageUsersUseCase: ManageUsersUseCase) {}

  async getAll(req: Request, res: Response) {
    try {
      const users = await this.manageUsersUseCase.getUsers();
      return res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { code: 'ERROR', message: error.message } });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { email, role, password } = req.body;
      const user = await this.manageUsersUseCase.createUser(email, role, password);
      return res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { code: 'ERROR', message: error.message } });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.manageUsersUseCase.deleteUser(req.params.id as string);
      return res.status(200).json({ success: true, data: { message: 'Deleted' } });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { code: 'ERROR', message: error.message } });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      await this.manageUsersUseCase.changePassword(req.params.id as string, password);
      return res.status(200).json({ success: true, data: { message: 'Password updated' } });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { code: 'ERROR', message: error.message } });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { role } = req.body;
      await this.manageUsersUseCase.updateUserRole(req.params.id as string, role);
      return res.status(200).json({ success: true, data: { message: 'Role updated' } });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { code: 'ERROR', message: error.message } });
    }
  }

  async setFormAccess(req: Request, res: Response) {
    try {
      const { form_identifiers } = req.body;
      await this.manageUsersUseCase.setFormAccess(req.params.id as string, form_identifiers);
      return res.status(200).json({ success: true, data: { message: 'Access updated' } });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { code: 'ERROR', message: error.message } });
    }
  }
}
