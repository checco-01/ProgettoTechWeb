package roadToUnina.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class AuthCookieService {

    public static final String COOKIE_NAME = "auth_token";

    private final long expirationMs;
    private final boolean secure;

    public AuthCookieService(
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.cookie-secure:false}") boolean secure) {
        this.expirationMs = expirationMs;
        this.secure = secure;
    }

    public String buildCookie(String token) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(expirationMs / 1000)
                .build()
                .toString();
    }

    public String clearCookie() {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build()
                .toString();
    }

    public String extractToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
