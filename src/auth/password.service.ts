import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/** Argon2id with OWASP-recommended parameters (19 MiB, t=2, p=1). */
const ARGON2_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

@Injectable()
export class PasswordService {
  /** Used when the email does not exist so response time does not reveal it. */
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  /** Spends the same work as a real verification and always fails. */
  async verifyAgainstDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash('dummy-password-for-timing-equalization');
    await this.verify(await this.dummyHash, password);
    return false;
  }
}
