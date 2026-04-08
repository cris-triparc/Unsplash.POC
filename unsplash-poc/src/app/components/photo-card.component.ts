import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UnsplashPhoto } from '../models/unsplash';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <div class="card" (click)="select.emit(photo())" (keydown.enter)="select.emit(photo())" tabindex="0">
      <div class="image-container">
        <img
          [ngSrc]="photo().urls.small"
          [alt]="photo().alt_description || 'Unsplash Image'"
          fill
          priority
        />
      </div>
      <div class="attribution">
        Photo by
        <a [href]="photo().user.links.html + '?utm_source=unsplash_poc&utm_medium=referral'" target="_blank" (click)="$event.stopPropagation()">
          {{ photo().user.name }}
        </a>
        on
        <a href="https://unsplash.com/?utm_source=unsplash_poc&utm_medium=referral" target="_blank" (click)="$event.stopPropagation()">
          Unsplash
        </a>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .card {
      position: relative;
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      transition: transform 0.2s;
      background: white;
    }
    .card:hover {
      transform: translateY(-4px);
    }
    .image-container {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
    }
    .attribution {
      padding: 12px;
      font-size: 0.875rem;
      color: #555;
    }
    .attribution a {
      color: #000;
      text-decoration: underline;
      font-weight: 500;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoCardComponent {
  photo = input.required<UnsplashPhoto>();
  select = output<UnsplashPhoto>();
}
