package roadToUnina.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import roadToUnina.auth.AuthRequest;
import roadToUnina.auth.JwtUtil;
import roadToUnina.model.User;
import roadToUnina.repository.UserRepository;

@Service
public class AuthService {

    // Protezione anti-brute-force: blocca l'account dopo troppi tentativi falliti.
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    private record Attempt(int count, Instant firstFailure) {}

    public String register(AuthRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Registration failed");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getUsername(), hashedPassword);
        userRepository.save(user);

        return jwtUtil.generateToken(user.getUsername());
    }

    public String login(AuthRequest request) {
        if (isLocked(request.getUsername())) {
            throw new IllegalStateException("Troppi tentativi falliti. Riprova più tardi.");
        }

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> {
            recordFailure(request.getUsername());
            return new IllegalArgumentException("Invalid username or password");
        });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            recordFailure(request.getUsername());
            throw new IllegalArgumentException("Invalid username or password");
        }

        reset(request.getUsername());
        return jwtUtil.generateToken(user.getUsername());
    }

    private boolean isLocked(String username) {
        Attempt attempt = attempts.get(normalize(username));
        if (attempt == null) {
            return false;
        }
        if (attempt.count() >= MAX_ATTEMPTS) {
            if (Instant.now().isBefore(attempt.firstFailure().plus(LOCK_DURATION))) {
                return true;
            }
            // Finestra scaduta: azzera il contatore
            attempts.remove(normalize(username));
        }
        return false;
    }

    private void recordFailure(String username) {
        String key = normalize(username);
        attempts.compute(key, (_, current) -> {
            if (current == null || Instant.now().isAfter(current.firstFailure().plus(LOCK_DURATION))) {
                return new Attempt(1, Instant.now());
            }
            return new Attempt(current.count() + 1, current.firstFailure());
        });
    }

    private void reset(String username) {
        attempts.remove(normalize(username));
    }

    private String normalize(String username) {
        return username == null ? "" : username.toLowerCase(Locale.ROOT);
    }
}
