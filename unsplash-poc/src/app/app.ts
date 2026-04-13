import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  effect,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { UnsplashService } from './services/unsplash.service';
import { UnsplashPhoto } from './models/unsplash';
import { PhotoCardComponent } from './components/photo-card.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PhotoCardComponent, ReactiveFormsModule, FormsModule, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnDestroy {
  private readonly unsplashService = inject(UnsplashService);

  readonly query = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly customSizeControl = new FormControl(0, { nonNullable: true });
  readonly photos = signal<UnsplashPhoto[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly selectedPhoto = signal<UnsplashPhoto | null>(null);
  readonly currentImageUrl = signal<string | null>(null);
  readonly currentSize = signal<keyof UnsplashPhoto['urls'] | null>('regular');
  readonly currentDimensions = signal({
    width: 0,
    height: 0,
  });
  readonly customWidth = signal<number | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly sizes: (keyof UnsplashPhoto['urls'])[] = ['raw', 'full', 'small', 'thumb', 'small_s3'];

  private readonly bottomObserver = viewChild<ElementRef>('bottomObserver');
  private observer: IntersectionObserver | null = null;

  constructor() {
    effect(() => {
      const el = this.bottomObserver()?.nativeElement;
      if (el) {
        this.setupObserver(el);
      }
    });

    effect((onCleanup) => {
      const photo = this.selectedPhoto();
      const url = this.currentImageUrl();

      if (!photo || !url) {
        this.currentDimensions.set({ width: 0, height: 0 });
        return;
      }

      const img = new Image();
      let cancelled = false;

      img.onload = () => {
        if (cancelled) return;
        this.currentDimensions.set({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        if (cancelled) return;
        this.currentDimensions.set({ width: 0, height: 0 });
      };

      img.src = url;

      onCleanup(() => {
        cancelled = true;
        img.onload = null;
        img.onerror = null;
      });
    });

    this.searchControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.query.set(value);
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.search();
      });
  }

  private setupObserver(el: HTMLElement) {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !this.loading() &&
          !this.loadingMore() &&
          this.page() < this.totalPages()
        ) {
          this.loadMore();
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(el);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  async search() {
    const trimmedQuery = this.query().trim();
    if (!trimmedQuery) {
      this.photos.set([]);
      this.totalPages.set(0);
      return;
    }

    this.loading.set(true);
    this.page.set(1);
    try {
      this.unsplashService.searchPhotos(this.query(), 1).subscribe({
        next: (response) => {
          this.photos.set(response.results);
          this.totalPages.set(response.total_pages);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error searching photos:', err);
          this.loading.set(false);
        },
      });
    } catch (error) {
      console.error('Search failed:', error);
      this.loading.set(false);
    }
  }

  async loadMore() {
    if (this.loadingMore() || this.page() >= this.totalPages()) return;

    this.loadingMore.set(true);
    const nextPage = this.page() + 1;
    this.page.set(nextPage);

    this.unsplashService.searchPhotos(this.query(), nextPage).subscribe({
      next: (response) => {
        this.photos.update((current) => [...current, ...response.results]);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('Error loading more photos:', err);
        this.loadingMore.set(false);
      },
    });
  }

  selectPhoto(photo: UnsplashPhoto) {
    this.loading.set(true);
    this.unsplashService.getPhotoDetails(photo.id).subscribe({
      next: (details) => {
        this.selectedPhoto.set(details);
        this.currentImageUrl.set(details.urls.regular);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching photo details:', err);
        this.selectedPhoto.set(photo); // fallback to basic data
        this.currentImageUrl.set(photo.urls.regular);
        this.loading.set(false);
      },
    });
  }

  setImageUrl(size: keyof UnsplashPhoto['urls'], url: string) {
    this.currentImageUrl.set(url);
    this.currentSize.set(size);
    this.customWidth.set(null);
  }

  resetImageUrl() {
    const photo = this.selectedPhoto();
    if (photo) {
      this.currentImageUrl.set(photo.urls.regular);
    }
    this.currentSize.set('regular');
    this.customWidth.set(null);
  }

  resizeImage() {
    const photo = this.selectedPhoto();
    if (!photo) return;
    const width = Number(this.customSizeControl.value);

    if (!Number.isFinite(width) || width <= 0) {
      this.resetImageUrl();
      return;
    }

    const roundedWidth = Math.round(width);
    this.customWidth.set(roundedWidth);
    this.unsplashService.resizePhoto(photo.urls.raw, roundedWidth).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.currentImageUrl.set(objectUrl);
        this.currentSize.set(null);
      },
      error: (error) => {
        console.error('Error resizing image', error);
        this.resetImageUrl();
      },
    });
  }

  closeModal() {
    this.selectedPhoto.set(null);
    this.currentImageUrl.set(null);
    this.currentSize.set('regular');
    this.currentDimensions.set({ width: 0, height: 0 });
    this.customWidth.set(null);
  }

  downloadPhoto(photo: UnsplashPhoto) {
    // Track download as per Unsplash API guidelines
    this.unsplashService.trackDownload(photo.id).subscribe({
      next: () => {
        console.log(`Download tracked for photo ${photo.id}`);
        // To properly download, open the download link.
        // As per Unsplash API: `download` link in search/photo object.
        window.open(photo.links.download + '&force=true', '_blank');
      },
      error: (err) => console.error('Error tracking download:', err),
    });
  }
}
