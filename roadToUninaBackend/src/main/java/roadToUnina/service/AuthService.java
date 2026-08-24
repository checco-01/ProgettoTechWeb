package roadToUnina.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import roadToUnina.auth.AuthRequest;
import roadToUnina.auth.JwtUtil;
import roadToUnina.model.User;
import roadToUnina.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.loginAttemptService = loginAttemptService;
    }

    public String register(AuthRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getUsername(), hashedPassword);
        userRepository.save(user);

        return jwtUtil.generateToken(user.getUsername());
    }

    public String login(AuthRequest request) {
        if (loginAttemptService.isLocked(request.getUsername())) {
            throw new IllegalStateException("Troppi tentativi falliti. Riprova più tardi.");
        }

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            loginAttemptService.recordFailure(request.getUsername());
            return new IllegalArgumentException("Invalid username or password");
        });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            loginAttemptService.recordFailure(request.getUsername());
            throw new IllegalArgumentException("Invalid username or password");
        }

        loginAttemptService.reset(request.getUsername());
        return jwtUtil.generateToken(user.getUsername());
    }
}
