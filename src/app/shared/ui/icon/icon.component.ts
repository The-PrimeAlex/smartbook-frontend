import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `<svg
    [lucideIcon]="icon()"
    [size]="size()"
    [strokeWidth]="strokeWidth()"
    [attr.class]="class()"
    [attr.aria-hidden]="ariaHidden()"
    [attr.aria-label]="ariaLabel()"
  ></svg>`,
})
export class IconComponent {
  icon = input.required<any>();
  size = input<number>(16);
  strokeWidth = input<number>(2);
  class = input<string>('');
  ariaHidden = input<string>('true');
  ariaLabel = input<string | null>(null);
}
