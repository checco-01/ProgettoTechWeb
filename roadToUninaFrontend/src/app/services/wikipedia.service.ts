import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WikiPage {
  title: string;
  html: string;
  links: string[];
}

@Injectable({ providedIn: 'root' })
export class WikipediaService {
  private readonly baseUrl = 'https://it.wikipedia.org/w/api.php';
  private readonly targetPage = 'Università_degli_Studi_di_Napoli_Federico_II';

  constructor(private http: HttpClient) {}

  getTargetPage(): string {
    return this.targetPage.replace(/_/g, ' ');
  }

  getRandomStart(): Observable<string> {
    const url = `${this.baseUrl}?action=query&list=random&rnnamespace=0&rnfilterredir=nonredirects&rnlimit=5&format=json&origin=*`;
    return this.http.get<{ query: { random: { id: number; title: string }[] } }>(url).pipe(
      map((res) => {
        const titles = res.query.random.map((r) => r.title);
        const valid = titles.find((t) => t !== this.targetPage.replace(/_/g, ' '));
        return valid ?? titles[0];
      }),
    );
  }

  getPage(title: string): Observable<WikiPage> {
    const url = `${this.baseUrl}?action=parse&page=${encodeURIComponent(title)}&prop=text|displaytitle&redirects=true&format=json&origin=*`;
    return this.http
      .get<{
        parse: {
          title: string;
          text: { '*': string };
        };
      }>(url)
      .pipe(
        map((res) => {
          const rawHtml = res.parse.text['*'];
          const links = this.extractLinks(rawHtml);
          const cleanedHtml = this.cleanHtml(rawHtml);
          return {
            title: res.parse.title,
            html: cleanedHtml,
            links,
          };
        }),
      );
  }

  private extractLinks(html: string): string[] {
    const linkSet = new Set<string>();
    const regex = /<a\b[^>]*?\bhref="\/wiki\/([^"#]+?)"[^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const anchorTag = match[0];
      const title = decodeURIComponent(match[1]);

      if (anchorTag.includes('class="new') || anchorTag.includes('class="mw-disambig')) {
        continue;
      }

      if (
        title.startsWith('Speciale:') ||
        title.startsWith('Aiuto:') ||
        title.startsWith('Wikipedia:') ||
        title.startsWith('Categoria:') ||
        title.startsWith('Template:') ||
        title.startsWith('Portale:') ||
        title.startsWith('Discussioni_') ||
        title.startsWith('File:')
      )
        continue;

      linkSet.add(title);
    }
    return Array.from(linkSet);
  }

  private cleanHtml(html: string): string {
    let cleaned = html;

    cleaned = cleaned.replace(/<span class="mw-editsection">[\s\S]*?<\/span><\/span>/g, '');

    cleaned = cleaned.replace(/\sclass="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\sstyle="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\sdata-[a-zA-Z-]+="[^"]*"/gi, '');

    cleaned = cleaned.replace(/\/\/upload\.wikimedia\.org/g, 'https://upload.wikimedia.org');

    cleaned = cleaned.replace(/href="\/wiki\/([^"]+)"/g, 'href="./wiki/$1"');

    cleaned = cleaned.replace(
      /<a\s[^>]*href="\.\/wiki\/(File:|Categoria:|Speciale:|Aiuto:|Wikipedia:|Template:|Portale:)[^"]*"[^>]*>/gi,
      '<a>',
    );

    cleaned = cleaned.replace(/<a\s[^>]*href="(?!\.\/wiki\/)[^"]*"[^>]*>/gi, '<a>');

    return cleaned;
  }
}
