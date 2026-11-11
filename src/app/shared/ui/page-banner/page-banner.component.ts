import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-page-banner',
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `
    <header
      class="app-page-banner"
      [attr.data-deco]="deco()"
    >
      <div class="banner-deco-lines"></div>
      <div class="banner-deco-dots"></div>
      <div class="banner-deco-corner"></div>
      <div class="banner-heading">
        @if (icon()) {
          <div class="banner-icon-wrap">
            <svg
              class="banner-icon"
              [lucideIcon]="icon()"
              [size]="iconSize()"
              [strokeWidth]="2"
              aria-hidden="true"
            ></svg>
          </div>
        }
        <div class="banner-heading-text">
          @if (eyebrow()) {
            <span class="eyebrow">{{ eyebrow() }}</span>
          }
          <h1>{{ title() }}</h1>
          @if (description()) {
            <p class="banner-subtitle">
              {{ description() }}
            </p>
          }
        </div>
      </div>
      <div class="banner-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }

    /* ── Banner base: matches calendar header style ── */
    .app-page-banner {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--banner-padding, 30px 32px);
      margin-bottom: 20px;
      border-radius: var(--banner-radius, 16px);
      flex-wrap: wrap;
      gap: 20px;
      background: var(--banner-bg, #142b4a);
      box-shadow: var(
        --banner-shadow,
        0 8px 24px rgba(20, 33, 61, 0.1)
      );
      animation: bannerFadeIn 600ms ease both;
    }

    @keyframes bannerFadeIn {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* ── Dark mode ── */
    [data-theme='dark'] .app-page-banner {
      background: #1e293b;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    /* ── Decorative elements: geometric accents ── */

    /* Diagonal accent lines — subtle parallel strips */
    .banner-deco-lines {
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .banner-deco-lines::before {
      content: '';
      position: absolute;
      top: -50%;
      right: 20%;
      width: 2px;
      height: 200%;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        var(--brand-accent, #f28c28) 20%,
        var(--brand-accent, #f28c28) 80%,
        transparent 100%
      );
      opacity: 0.25;
      transform: rotate(15deg);
    }

    .banner-deco-lines::after {
      content: '';
      position: absolute;
      top: -50%;
      right: 35%;
      width: 1px;
      height: 200%;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        var(--brand-accent, #f28c28) 30%,
        var(--brand-accent, #f28c28) 70%,
        transparent 100%
      );
      opacity: 0.18;
      transform: rotate(15deg);
    }

    /* Dot grid pattern — subtle background texture */
    .banner-deco-dots {
      position: absolute;
      top: 0;
      right: 0;
      width: 180px;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.1;
      background-image: radial-gradient(
        circle,
        var(--brand-accent, #f28c28) 1.5px,
        transparent 1.5px
      );
      background-size: 16px 16px;
      mask-image: linear-gradient(
        to left,
        rgba(0, 0, 0, 0.5) 0%,
        transparent 80%
      );
      -webkit-mask-image: linear-gradient(
        to left,
        rgba(0, 0, 0, 0.5) 0%,
        transparent 80%
      );
    }

    /* Corner triangle accent — top-right corner */
    .banner-deco-corner {
      position: absolute;
      top: 0;
      right: 0;
      width: 120px;
      height: 120px;
      pointer-events: none;
      z-index: 0;
      opacity: 0.12;
      background: linear-gradient(
        135deg,
        var(--brand-accent, #f28c28) 0%,
        transparent 50%
      );
      clip-path: polygon(100% 0, 0, 100% 100%);
    }

    /* Deco variant: shift decorations based on data-deco */
    .app-page-banner[data-deco='b']
      .banner-deco-lines::before {
      right: 10%;
      opacity: 0.3;
    }
    .app-page-banner[data-deco='b']
      .banner-deco-lines::after {
      right: 25%;
      opacity: 0.22;
    }
    .app-page-banner[data-deco='b'] .banner-deco-corner {
      opacity: 0.15;
    }

    .app-page-banner[data-deco='c']
      .banner-deco-lines::before {
      right: 30%;
      opacity: 0.2;
    }
    .app-page-banner[data-deco='c']
      .banner-deco-lines::after {
      right: 45%;
      opacity: 0.14;
    }
    .app-page-banner[data-deco='c'] .banner-deco-corner {
      opacity: 0.08;
    }

    .app-page-banner[data-deco='d']
      .banner-deco-lines::before {
      right: 15%;
      opacity: 0.28;
    }
    .app-page-banner[data-deco='d']
      .banner-deco-lines::after {
      right: 30%;
      opacity: 0.2;
    }
    .app-page-banner[data-deco='d'] .banner-deco-corner {
      opacity: 0.13;
    }

    /* ── Heading: icon + text side by side ── */
    .banner-heading {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 1;
    }

    .banner-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      border-radius: 10px;
      background: rgba(242, 140, 40, 0.12);
      color: #f28c28;
      border: 1px solid rgba(242, 140, 40, 0.15);
    }

    .banner-icon {
      flex-shrink: 0;
    }

    .banner-heading-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .banner-heading h1 {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--banner-title-color, #ffffff);
      letter-spacing: -0.02em;
      line-height: 1.3;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--banner-eyebrow-color, #f28c28);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .eyebrow::before {
      width: 20px;
      height: 2px;
      border-radius: 99px;
      background: linear-gradient(
        90deg,
        var(--brand-accent, #f28c28),
        #ffd27a
      );
      content: '';
    }

    .banner-subtitle {
      margin: 4px 0 0;
      font-size: 0.875rem;
      color: var(
        --banner-subtitle-color,
        rgba(255, 255, 255, 0.72)
      );
      line-height: 1.5;
    }

    /* ── Actions ── */
    .banner-actions {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    /* ── Refresh button ── */
    .banner-actions ::ng-deep button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.65);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.4;
      white-space: nowrap;
      transition:
        border-color 150ms ease,
        color 150ms ease,
        background 150ms ease;
    }

    .banner-actions ::ng-deep button svg {
      flex-shrink: 0;
      transition: transform 500ms ease;
    }

    .banner-actions ::ng-deep button:hover:not(:disabled) {
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
      background: rgba(255, 255, 255, 0.06);
    }

    .banner-actions
      ::ng-deep
      button:hover:not(:disabled)
      svg {
      transform: rotate(180deg);
    }

    .banner-actions ::ng-deep button:active:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }

    /* Loading state — continuous spin */
    .banner-actions ::ng-deep button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .banner-actions ::ng-deep button:disabled svg {
      animation: refreshSpin 0.8s linear infinite;
    }

    @keyframes refreshSpin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .banner-actions ::ng-deep button:focus-visible {
      outline: 2px solid var(--brand-accent, #f28c28);
      outline-offset: 2px;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .app-page-banner {
        padding: 24px 20px;
        min-height: auto;
      }

      .banner-icon-wrap {
        width: 36px;
        height: 36px;
      }

      .banner-heading h1 {
        font-size: 1.125rem;
      }

      .banner-actions {
        width: 100%;
        margin-top: 12px;
      }

      /* Hide decorations on mobile */
      .banner-deco-lines,
      .banner-deco-dots,
      .banner-deco-corner {
        display: none;
      }
    }
  `,
})
export class PageBannerComponent {
  icon = input<any | null>(null);
  iconSize = input<number>(24);
  eyebrow = input<string | null>(null);
  title = input.required<string>();
  description = input<string | null>(null);
  deco = input<string>('a');
}
