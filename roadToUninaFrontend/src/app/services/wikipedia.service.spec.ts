import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { WikipediaService } from './wikipedia.service';

describe('WikipediaService', () => {
  let service: WikipediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WikipediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get a random start title different from the target page', () => {
    let result: string | undefined;
    service.getRandomStart().subscribe((t) => (result = t));

    const req = httpMock.expectOne((r) => r.url.includes('action=query'));
    expect(req.request.method).toBe('GET');
    req.flush({
      query: {
        random: [
          { id: 1, title: 'Napoli' },
          { id: 2, title: 'Università degli Studi di Napoli Federico II' },
        ],
      },
    });

    expect(result).toBe('Napoli');
  });

  it('should fall back to the first title when all are the target page', () => {
    let result: string | undefined;
    service.getRandomStart().subscribe((t) => (result = t));

    httpMock.expectOne((r) => r.url.includes('action=query')).flush({
      query: {
        random: [{ id: 1, title: 'Università degli Studi di Napoli Federico II' }],
      },
    });

    expect(result).toBe('Università degli Studi di Napoli Federico II');
  });

  it('should get a page and extract only valid wiki links', () => {
    let result: { title: string; html: string; links: string[] } | undefined;
    service.getPage('Napoli').subscribe((p) => (result = p));

    const html = `
      <a href="/wiki/Italia" class="">Italia</a>
      <a href="/wiki/Speciale:Pagina">Speciale</a>
      <a href="/wiki/Aiuto:Guida">Aiuto</a>
      <a href="/wiki/File:Foto.jpg">Foto</a>
      <a href="/wiki/Categoria:Geografia">Cat</a>
      <a href="/wiki/Napoli_(disambigua)" class="mw-disambig">Disambigua</a>
      <a href="https://example.com">Esterno</a>
    `;

    const req = httpMock.expectOne((r) => r.url.includes('action=parse'));
    expect(req.request.method).toBe('GET');
    req.flush({ parse: { title: 'Napoli', text: { '*': html } } });

    expect(result?.title).toBe('Napoli');
    expect(result?.links).toEqual(['Italia']);
  });

  it('should rewrite wiki hrefs to relative paths and neutralize external links', () => {
    let result: { html: string } | undefined;
    service.getPage('Napoli').subscribe((p) => (result = p));

    httpMock.expectOne((r) => r.url.includes('action=parse')).flush({
      parse: {
        title: 'Napoli',
        text: { '*': '<a href="/wiki/Italia">Italia</a><a href="https://example.com">Ext</a>' },
      },
    });

    expect(result?.html).toContain('href="./wiki/Italia"');
    expect(result?.html).toContain('<a>');
  });

  it('should convert upload urls to https', () => {
    let result: { html: string } | undefined;
    service.getPage('Napoli').subscribe((p) => (result = p));

    httpMock.expectOne((r) => r.url.includes('action=parse')).flush({
      parse: {
        title: 'Napoli',
        text: { '*': '<img src="//upload.wikimedia.org/x.png"  alt=""/>' },
      },
    });

    expect(result?.html).toContain('https://upload.wikimedia.org/x.png');
  });
});
