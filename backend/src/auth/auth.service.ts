import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) { }

  async login(loginDto: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) return null;

    let isMatch = false;
    let needsMigration = false;

    // 1. Try bcrypt compare
    isMatch = await bcrypt.compare(loginDto.password, user.password);

    // 2. Fallback: Check plain text (Lazy Migration)
    if (!isMatch && user.password === loginDto.password) {
      isMatch = true;
      needsMigration = true;
    }

    if (isMatch) {
      // 3. Migrate if needed
      if (needsMigration) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(loginDto.password, salt);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log(`[Security] Migrated password for user ${user.email}`);
      }

      const { password, ...result } = user;
      const payload = { username: user.email, sub: user.id, type: user.type };

      return {
        ...result,
        access_token: this.jwtService.sign(payload),
      };
    }
    return null;
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
