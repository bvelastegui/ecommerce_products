import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { scryptSync, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user || !this.verifyPassword(loginDto.password, user.password)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Solo los administradores pueden ingresar al panel
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Solo los usuarios administradores pueden ingresar',
      );
    }

    const payload = { sub: user._id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Verifica la contraseña contra el hash scrypt almacenado en formato salt:hash
  private verifyPassword(password: string, storedPassword: string): boolean {
    const [salt, hash] = storedPassword.split(':');
    if (!salt || !hash) return false;

    const derivedKey = scryptSync(password, salt, 64);
    const storedKey = Buffer.from(hash, 'hex');

    return (
      storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey)
    );
  }
}
