package roadToUnina.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rate limiting per IP su login e registrazione (finestra fissa in memoria).
 * Protegge da brute force e da spam di registrazioni.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int LOGIN_LIMIT = 20;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final int REGISTER_LIMIT = 10;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    private record Window(int count, long windowStartMillis) {
        boolean expired(Duration window) {
            return System.currentTimeMillis() - windowStartMillis >= window.toMillis();
        }

        Window increment() {
            return new Window(count + 1, windowStartMillis);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        if (!"POST".equals(method)) {
            return true;
        }
        String uri = request.getRequestURI();
        return !uri.endsWith("/api/auth/login") && !uri.endsWith("/api/auth/register");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        boolean isLogin = request.getRequestURI().endsWith("/api/auth/login");
        Duration window = isLogin ? LOGIN_WINDOW : REGISTER_WINDOW;
        int limit = isLogin ? LOGIN_LIMIT : REGISTER_LIMIT;
        String key = (isLogin ? "login:" : "register:") + clientIp(request);

        Window current = windows.compute(key, (_, w) -> {
            if (w == null || w.expired(window)) {
                return new Window(1, System.currentTimeMillis());
            }
            return w.increment();
        });

        if (current.count() > limit) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\":\"Troppe richieste. Riprova più tardi.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        // In produzione dietro un reverse proxy usare l'header X-Forwarded-For
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
