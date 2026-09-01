package roadToUnina.exception;

/** Lanciata quando un utente supera i limiti di attività (rate limiting). */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
