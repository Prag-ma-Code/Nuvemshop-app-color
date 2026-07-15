import { userRepository } from "@repository";
import { TiendanubeAuthInterface, LoginRequestInterface } from "@features/auth";

/**
 * In production mode, the back-end needs to implement its own authentication for the API.
 */
class AuthService {
    async login(loginRequest: LoginRequestInterface): Promise<TiendanubeAuthInterface | null> {
        return userRepository.findFirst();
    }
}

export default new AuthService();