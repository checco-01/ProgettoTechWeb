package roadToUnina.service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Client per l'API di Wikipedia italiana. Usato dal server per verificare
 * che un link esista realmente nella pagina corrente (anti-cheat) e per
 * risolvere i titoli (i redirect vengono seguiti, come nel frontend).
 */
@Component
public class WikipediaClient {

    private static final String API_URL = "https://it.wikipedia.org/w/api.php";

    // Stesse esclusioni del frontend (wikipedia.service.ts): i link verso
    // questi namespace non sono cliccabili nel gioco.
    private static final List<String> EXCLUDED_PREFIXES = List.of(
            "Speciale:", "Aiuto:", "Wikipedia:", "Categoria:", "Template:", "Portale:", "Discussioni_", "File:");

    private final RestClient restClient;

    public WikipediaClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl(API_URL)
                .defaultHeader(HttpHeaders.USER_AGENT, "RoadToUnina/1.0 (progetto universitario)")
                .build();
    }

    /**
     * Restituisce una pagina casuale nel namespace articoli (ns=0), escludendo
     * i redirect e il titolo {@code excludedTitle} (che il chiamante vuole
     * evitare: la pagina obiettivo). Vuoto se l'API non risponde.
     *
     * <p>La scelta della pagina di partenza avviene qui, lato server: il
     * client non può fornire una partenza "facile" né partire dall'obiettivo.
     */
    public Optional<String> getRandomPage(String excludedTitle) {
        RandomResponse response;
        try {
            response = restClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("action", "query")
                            .queryParam("list", "random")
                            .queryParam("rnnamespace", "0")
                            .queryParam("rnfilterredir", "nonredirects")
                            .queryParam("rnlimit", "5")
                            .queryParam("formatversion", "2")
                            .queryParam("format", "json")
                            .queryParam("origin", "*")
                            .build())
                    .retrieve()
                    .body(RandomResponse.class);
        } catch (Exception e) {
            // Fail-closed: se non possiamo scegliere una partenza casuale, rifiutiamo
            return Optional.empty();
        }

        if (response == null || response.query() == null || response.query().random() == null) {
            return Optional.empty();
        }
        return response.query().random().stream()
                .map(RandomEntry::title)
                .filter(title -> title != null && !title.isBlank())
                .map(WikipediaClient::normalize)
                .filter(title -> !title.equalsIgnoreCase(normalize(excludedTitle)))
                .findFirst();
    }

    /**
     * Verifica che la pagina {@code fromPage} contenga un wikilink verso
     * {@code toPage} (i redirect vengono risolti, come nel frontend).
     */
    public boolean hasLink(String fromPage, String toPage) {
        String target = normalize(toPage);
        return getPageLinks(fromPage).stream().anyMatch(link -> normalize(link).equalsIgnoreCase(target));
    }

    /**
     * Risolve un titolo seguendo i redirect (es. "Unina" ->
     * "Università degli Studi di Napoli Federico II"). Vuoto se la pagina
     * non esiste o l'API non risponde.
     */
    public Optional<String> resolveTitle(String title) {
        return fetchParse(title).map(Parse::title);
    }

    /**
     * Restituisce i titoli dei wikilink della pagina (namespace esclusi),
     * oppure un insieme vuoto se la pagina non esiste o l'API non risponde.
     */
    public Set<String> getPageLinks(String title) {
        Optional<Parse> parse = fetchParse(title);
        if (parse.isEmpty() || parse.get().links() == null) {
            return Set.of();
        }

        Set<String> links = new HashSet<>();
        for (Link link : parse.get().links()) {
            String linkTitle = link.title();
            if (linkTitle == null || isExcluded(linkTitle)) {
                continue;
            }
            links.add(linkTitle);
        }
        return links;
    }

    private Optional<Parse> fetchParse(String title) {
        ParseResponse response;
        try {
            response = restClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("action", "parse")
                            .queryParam("page", title)
                            .queryParam("prop", "links")
                            .queryParam("redirects", "1")
                            .queryParam("formatversion", "2")
                            .queryParam("format", "json")
                            .queryParam("origin", "*")
                            .build())
                    .retrieve()
                    .body(ParseResponse.class);
        } catch (Exception e) {
            // Fail-closed: se non possiamo verificare, rifiutiamo
            return Optional.empty();
        }

        if (response == null || response.parse() == null) {
            return Optional.empty();
        }
        return Optional.of(response.parse());
    }

    private static boolean isExcluded(String title) {
        return EXCLUDED_PREFIXES.stream().anyMatch(title::startsWith);
    }

    /** Normalizza un titolo: underscore -> spazio e spazi ai bordi rimossi. */
    public static String normalize(String title) {
        return title == null ? "" : title.replace('_', ' ').trim();
    }

    private record ParseResponse(Parse parse) {}

    private record Parse(String title, List<Link> links) {}

    private record Link(int ns, String title) {}

    private record RandomResponse(RandomQuery query) {}

    private record RandomQuery(List<RandomEntry> random) {}

    private record RandomEntry(int id, int ns, String title) {}
}
