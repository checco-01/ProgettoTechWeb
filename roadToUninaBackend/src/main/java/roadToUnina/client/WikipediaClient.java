package roadToUnina.client;

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
        RandomQueryResponse randomQueryResponse;
        try {
            randomQueryResponse = restClient
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
                    .body(RandomQueryResponse.class);
        } catch (Exception e) {
            // Fail-closed: se non possiamo scegliere una partenza casuale, rifiutiamo
            return Optional.empty();
        }

        if (randomQueryResponse == null
                || randomQueryResponse.query() == null
                || randomQueryResponse.query().random() == null) {
            return Optional.empty();
        }
        return randomQueryResponse.query().random().stream()
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
        return fetchParse(title).map(Parse::title).filter(resolved -> resolved != null && !resolved.isBlank());
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
        ParseResponse parseResponse;
        try {
            parseResponse = restClient
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

        if (parseResponse == null || parseResponse.parse() == null) {
            return Optional.empty();
        }
        return Optional.of(parseResponse.parse());
    }

    private static boolean isExcluded(String title) {
        return EXCLUDED_PREFIXES.stream().anyMatch(title::startsWith);
    }

    /** Normalizza un titolo: underscore -> spazio e spazi ai bordi rimossi. */
    public static String normalize(String title) {
        return title == null ? "" : title.replace('_', ' ').trim();
    }

    /**
     * Involucro della risposta di {@code action=parse}: l'API restituisce
     * titolo e link dentro la chiave {@code parse}.
     */
    private record ParseResponse(Parse parse) {}

    private record Parse(String title, List<Link> links) {}

    private record Link(int ns, String title) {}

    /** Involucro di {@code action=query&list=random}: i risultati stanno in {@code query.random}. */
    private record RandomQueryResponse(QueryData query) {}

    private record QueryData(List<RandomEntry> random) {}

    private record RandomEntry(int id, int ns, String title) {}
}
