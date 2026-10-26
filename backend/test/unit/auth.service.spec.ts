import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../src/modules/auth/auth.service';
import { jwtSecret } from '../../src/modules/auth/constants';

describe('AuthService', () => {
  const visitorService = {
    getVisitorByEmail: jest.fn(),
    create: jest.fn(),
  };
  const vendorService = {
    getVendorByEmail: jest.fn(),
    createVendor: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };
  const mailService = {};
  const otpRepository = {};

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      visitorService as any,
      vendorService as any,
      jwtService as any,
      mailService as any,
      otpRepository as any,
    );
  });

  describe('validateVisitor', () => {
    it('returns the visitor when the email and password are valid', async () => {
      const visitor = {
        id: 'visitor-1',
        email: 'visitor@example.com',
        password: 'hashed-password',
      };
      visitorService.getVisitorByEmail.mockResolvedValue(visitor);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.validateVisitor(' Visitor@Example.com ', 'password'),
      ).resolves.toBe(visitor);

      expect(visitorService.getVisitorByEmail).toHaveBeenCalledWith(
        'visitor@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
    });

    it('returns null when the visitor does not exist or the password is invalid', async () => {
      visitorService.getVisitorByEmail.mockResolvedValueOnce(null);
      await expect(
        service.validateVisitor('missing@example.com', 'password'),
      ).resolves.toBeNull();

      const visitor = {
        email: 'visitor@example.com',
        password: 'hashed-password',
      };
      visitorService.getVisitorByEmail.mockResolvedValueOnce(visitor);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.validateVisitor('visitor@example.com', 'wrong-password'),
      ).resolves.toBeNull();
    });
  });

  describe('login tokens', () => {
    it('signs a visitor token with the visitor identity and role', () => {
      const visitor = {
        id: 'visitor-1',
        email: 'visitor@example.com',
      };
      jwtService.sign.mockReturnValue('visitor-token');

      expect(service.loginVisitor(visitor as any)).toEqual({
        access_token: 'visitor-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: visitor.email,
        sub: visitor.id,
        role: 'visitor',
      });
    });

    it('signs a vendor token with the vendor identity and role', () => {
      const vendor = {
        id: 'vendor-1',
        email: 'vendor@example.com',
      };
      jwtService.sign.mockReturnValue('vendor-token');

      expect(service.loginVendor(vendor as any)).toEqual({
        access_token: 'vendor-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: vendor.email,
        sub: vendor.id,
        role: 'vendor',
      });
    });
  });

  describe('completeVisitorSignup', () => {
    const signupDto = {
      email: ' Visitor@Example.com ',
      password: 'strong-password',
      signupVerificationToken: 'verified-signup-token',
    };

    it('creates a visitor and returns a login token after verification', async () => {
      const visitor = {
        id: 'visitor-1',
        email: 'visitor@example.com',
      };
      jwtService.verify.mockReturnValue({
        email: 'visitor@example.com',
        role: 'visitor',
        purpose: 'signup_verified',
      });
      visitorService.getVisitorByEmail.mockResolvedValue(null);
      vendorService.getVendorByEmail.mockResolvedValue(null);
      visitorService.create.mockResolvedValue(visitor);
      jwtService.sign.mockReturnValue('visitor-token');

      await expect(service.completeVisitorSignup(signupDto)).resolves.toEqual({
        message: 'Registration successful!',
        access_token: 'visitor-token',
        visitorId: 'visitor-1',
        visitorEmail: 'visitor@example.com',
      });

      expect(visitorService.create).toHaveBeenCalledWith({
        email: 'visitor@example.com',
        password: signupDto.password,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: visitor.email,
        sub: visitor.id,
        role: 'visitor',
      });
    });

    it('rejects registration when the email already belongs to an account', async () => {
      jwtService.verify.mockReturnValue({
        email: 'visitor@example.com',
        role: 'visitor',
        purpose: 'signup_verified',
      });
      visitorService.getVisitorByEmail.mockResolvedValue({
        id: 'existing-visitor',
      });

      await expect(service.completeVisitorSignup(signupDto)).rejects.toThrow(
        new BadRequestException(
          'An account with this email address already exists.',
        ),
      );
      expect(visitorService.create).not.toHaveBeenCalled();
    });
  });
});
