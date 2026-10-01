import crypto from 'crypto';

export class FolioGeneratorService {
  static async generate(
    strategy: 'CONSECUTIVE' | 'PREFIX_DATE_CONSECUTIVE' | 'RANDOM_CHECKSUM',
    prefix: string | null,
    submissionCount: number
  ): Promise<string> {
    const safePrefix = prefix ? `${prefix}-` : '';
    const nextNumber = submissionCount + 1;
    
    switch (strategy) {
      case 'CONSECUTIVE':
        return `${safePrefix}${nextNumber.toString().padStart(4, '0')}`;
        
      case 'PREFIX_DATE_CONSECUTIVE':
        const date = new Date();
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        return `${safePrefix}${yy}${mm}${dd}-${nextNumber.toString().padStart(4, '0')}`;
        
      case 'RANDOM_CHECKSUM':
        // Generate a 6-char random alphanumeric string
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        // Calculate a simple checksum (e.g. sum of char codes modulo 10)
        let sum = 0;
        for (let i = 0; i < randomPart.length; i++) {
          sum += randomPart.charCodeAt(i);
        }
        const checksum = sum % 10;
        return `${safePrefix}${randomPart}${checksum}`;
        
      default:
        return `${safePrefix}${Date.now()}`;
    }
  }
}
