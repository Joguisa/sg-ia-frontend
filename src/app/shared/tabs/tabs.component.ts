import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="tabs-container">
      <div class="tabs-header">
        @for (tab of tabs(); track tab.id) {
          <button
            type="button"
            class="tab-button"
            [class.active]="activeTab() === tab.id"
            (click)="tabChange.emit(tab.id)">
            @if (tab.icon) {
              <i [class]="tab.icon"></i>
            }
            <span>{{ tab.label | translate }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .tabs-container {
      margin-bottom: 24px;
    }

    .tabs-header {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e5e7eb;
      padding: 0 4px;
    }

    .tab-button {
      background: none;
      border: none;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px 8px 0 0;
    }

    .tab-button:hover {
      color: #3b82f6;
      background: rgba(102, 126, 234, 0.05);
    }

    .tab-button.active {
      color: #3b82f6;
      font-weight: 600;
    }

    .tab-button.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 3px 3px 0 0;
    }

    .tab-button i {
      font-size: 16px;
    }

    @media (max-width: 600px) {
      .tab-button {
        padding: 12px 16px;
        font-size: 14px;
      }

      .tab-button span {
        display: none;
      }

      .tab-button i {
        font-size: 18px;
      }
    }

    @media (min-width: 601px) and (max-width: 900px) {
      .tab-button {
        padding: 12px 18px;
        font-size: 14px;
      }
    }
  `]
})
export class TabsComponent {
  tabs = input.required<Tab[]>();
  activeTab = input.required<string>();
  tabChange = output<string>();
}
