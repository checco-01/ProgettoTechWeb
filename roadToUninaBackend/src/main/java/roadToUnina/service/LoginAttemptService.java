package roadToUnina.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Traccia i tentativi di login falliti per username e blocca temporaneamente
 * l'account dopo troppi tentativi (protezione da brute force).
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    private record Attempt(int count, Instant firstFailure) {}

    public boolean isLocked(String username) {
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

    public void recordFailure(String username) {
        String key = normalize(username);
        attempts.compute(key, (_, current) -> {
            if (current == null || Instant.now().isAfter(current.firstFailure().plus(LOCK_DURATION))) {
                return new Attempt(1, Instant.now());
            }
            return new Attempt(current.count() + 1, current.firstFailure());
        });
    }

    public void reset(String username) {
        attempts.remove(normalize(username));
    }

    private String normalize(String username) {
        return username == null ? "" : username.toLowerCase(Locale.ROOT);
    }
}
