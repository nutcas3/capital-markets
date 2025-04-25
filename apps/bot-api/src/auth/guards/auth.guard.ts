import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-session-token'];

    if (!token) {
      return false;
    }

    const session = await this.authService.verifySession(token);
    if (!session) {
      return false;
    }

    // Attach session data to request
    request.user = session;
    return true;
  }
}
