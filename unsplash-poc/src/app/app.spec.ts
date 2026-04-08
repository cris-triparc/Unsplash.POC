import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Unsplash POC');
  });

  it('should call search after 500ms of typing', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const searchSpy = vi.spyOn(app, 'search');

    app.searchControl.setValue('test');
    vi.advanceTimersByTime(400);
    expect(searchSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(searchSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
