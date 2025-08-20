// src/app/shared/components/icon-picker/icon-picker.component.ts

import { Component, Input, Output, EventEmitter, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface IconCategory {
  name: string;
  icons: string[];
}

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="icon-picker-container">
      <!-- Icon Preview Button -->
      <div class="icon-preview-button" (click)="togglePicker()">
        <span class="material-icons icon-display">{{ value || 'add' }}</span>
        <span class="icon-name">{{ value || 'Select icon' }}</span>
        <span class="material-icons dropdown-icon">{{ isOpen ? 'expand_less' : 'expand_more' }}</span>
      </div>

      <!-- Icon Picker Dropdown -->
      <div class="icon-picker-dropdown" *ngIf="isOpen" [@slideIn]>
        <!-- Search Bar -->
        <div class="picker-search">
          <span class="material-icons search-icon">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterIcons()"
            placeholder="Search icons..."
            class="search-input"
            #searchInput>
          <button
            class="clear-search"
            *ngIf="searchQuery"
            (click)="clearSearch()">
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Category Tabs -->
        <div class="category-tabs" *ngIf="!searchQuery">
          <button
            class="category-tab"
            *ngFor="let category of categories"
            [class.active]="activeCategory === category.name"
            (click)="selectCategory(category.name)">
            {{ category.name }}
          </button>
        </div>

        <!-- Icons Grid -->
        <div class="icons-container">
          <!-- Recent Icons -->
          <div class="icon-section" *ngIf="recentIcons.length > 0 && !searchQuery">
            <label class="section-label">Recent</label>
            <div class="icons-grid">
              <div
                class="icon-item"
                *ngFor="let icon of recentIcons"
                [class.selected]="value === icon"
                (click)="selectIcon(icon)"
                [title]="icon">
                <span class="material-icons">{{ icon }}</span>
              </div>
            </div>
          </div>

          <!-- Filtered/Category Icons -->
          <div class="icon-section">
            <label class="section-label" *ngIf="!searchQuery">
              {{ activeCategory }}
              <span class="icon-count">({{ getActiveIcons().length }})</span>
            </label>
            <label class="section-label" *ngIf="searchQuery">
              Search Results
              <span class="icon-count">({{ filteredIcons.length }})</span>
            </label>

            <div class="icons-grid" *ngIf="getDisplayIcons().length > 0">
              <div
                class="icon-item"
                *ngFor="let icon of getDisplayIcons()"
                [class.selected]="value === icon"
                (click)="selectIcon(icon)"
                [title]="icon">
                <span class="material-icons">{{ icon }}</span>
                <span class="icon-label">{{ icon }}</span>
              </div>
            </div>

            <div class="no-results" *ngIf="getDisplayIcons().length === 0">
              <span class="material-icons">search_off</span>
              <p>No icons found</p>
            </div>
          </div>

          <!-- Custom Icon Input -->
          <div class="custom-icon-section">
            <label class="section-label">Custom Icon Name</label>
            <div class="custom-icon-input">
              <input
                type="text"
                [(ngModel)]="customIconName"
                placeholder="Enter Material Icon name"
                (keyup.enter)="applyCustomIcon()">
              <button class="preview-btn" (click)="previewCustomIcon()">
                <span class="material-icons">{{ customIconName || 'help_outline' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="picker-actions">
          <button class="action-btn" (click)="clearIcon()">Clear</button>
          <button class="action-btn primary" (click)="applyIcon()">Apply</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./icon-picker.component.scss']
})
export class IconPickerComponent implements OnInit {
  @Input() value: string = '';
  @Input() label: string = '';
  @Input() allowCustom: boolean = true;

  @Output() valueChange = new EventEmitter<string>();
  @Output() onApply = new EventEmitter<string>();

  isOpen = false;
  searchQuery = '';
  activeCategory = 'Common';
  customIconName = '';

  recentIcons: string[] = [];
  filteredIcons: string[] = [];

  categories: IconCategory[] = [
    {
      name: 'Common',
      icons: [
        'home', 'search', 'menu', 'close', 'settings', 'favorite', 'star', 'delete',
        'add', 'remove', 'edit', 'save', 'refresh', 'arrow_back', 'arrow_forward',
        'check', 'clear', 'done', 'info', 'warning', 'error', 'help', 'more_vert',
        'more_horiz', 'expand_more', 'expand_less', 'chevron_right', 'chevron_left'
      ]
    },
    {
      name: 'Navigation',
      icons: [
        'arrow_back', 'arrow_forward', 'arrow_upward', 'arrow_downward',
        'arrow_back_ios', 'arrow_forward_ios', 'chevron_left', 'chevron_right',
        'first_page', 'last_page', 'navigate_before', 'navigate_next',
        'close', 'menu', 'apps', 'more_vert', 'more_horiz', 'refresh',
        'fullscreen', 'fullscreen_exit', 'unfold_more', 'unfold_less'
      ]
    },
    {
      name: 'Actions',
      icons: [
        'search', 'zoom_in', 'zoom_out', 'done', 'done_all', 'check_circle',
        'cancel', 'delete', 'delete_forever', 'add', 'add_circle', 'remove',
        'remove_circle', 'edit', 'create', 'save', 'save_alt', 'get_app',
        'publish', 'share', 'reply', 'send', 'archive', 'unarchive'
      ]
    },
    {
      name: 'Content',
      icons: [
        'flag', 'bookmark', 'bookmark_border', 'link', 'link_off',
        'content_copy', 'content_cut', 'content_paste', 'drafts',
        'inbox', 'mail', 'markunread', 'redo', 'undo', 'report',
        'sort', 'filter_list', 'text_fields', 'title', 'format_quote'
      ]
    },
    {
      name: 'User',
      icons: [
        'person', 'person_add', 'person_outline', 'people', 'people_outline',
        'group', 'group_add', 'account_circle', 'account_box', 'face',
        'supervised_user_circle', 'badge', 'manage_accounts', 'admin_panel_settings'
      ]
    },
    {
      name: 'Communication',
      icons: [
        'message', 'chat', 'chat_bubble', 'forum', 'email', 'mail_outline',
        'call', 'phone', 'textsms', 'comment', 'notifications', 'notifications_none',
        'notifications_active', 'notification_important', 'feedback', 'announcement'
      ]
    },
    {
      name: 'Media',
      icons: [
        'image', 'photo', 'photo_camera', 'collections', 'videocam',
        'play_arrow', 'pause', 'stop', 'skip_next', 'skip_previous',
        'fast_forward', 'fast_rewind', 'volume_up', 'volume_down', 'volume_off',
        'music_note', 'audiotrack', 'album', 'mic', 'mic_off'
      ]
    },
    {
      name: 'Files',
      icons: [
        'folder', 'folder_open', 'create_new_folder', 'insert_drive_file',
        'attach_file', 'cloud', 'cloud_upload', 'cloud_download', 'cloud_done',
        'file_download', 'file_upload', 'description', 'picture_as_pdf'
      ]
    },
    {
      name: 'Editor',
      icons: [
        'format_bold', 'format_italic', 'format_underlined', 'format_strikethrough',
        'format_align_left', 'format_align_center', 'format_align_right', 'format_align_justify',
        'format_list_bulleted', 'format_list_numbered', 'format_indent_increase', 'format_indent_decrease',
        'format_size', 'format_color_text', 'format_color_fill', 'format_paint'
      ]
    },
    {
      name: 'Device',
      icons: [
        'computer', 'desktop_windows', 'laptop', 'smartphone', 'tablet',
        'watch', 'keyboard', 'mouse', 'memory', 'storage', 'usb',
        'battery_full', 'battery_charging_full', 'wifi', 'bluetooth', 'gps_fixed'
      ]
    },
    {
      name: 'Maps',
      icons: [
        'place', 'location_on', 'location_off', 'my_location', 'map',
        'directions', 'directions_car', 'directions_bus', 'directions_bike',
        'directions_walk', 'navigation', 'near_me', 'terrain', 'layers'
      ]
    },
    {
      name: 'Shopping',
      icons: [
        'shopping_cart', 'shopping_bag', 'store', 'local_mall', 'local_grocery_store',
        'add_shopping_cart', 'remove_shopping_cart', 'receipt', 'payment',
        'credit_card', 'loyalty', 'sell', 'discount', 'local_offer'
      ]
    },
    {
      name: 'Social',
      icons: [
        'share', 'thumb_up', 'thumb_down', 'favorite', 'favorite_border',
        'visibility', 'visibility_off', 'grade', 'star_border', 'star_half',
        'sentiment_satisfied', 'sentiment_dissatisfied', 'mood', 'mood_bad'
      ]
    },
    {
      name: 'Toggle',
      icons: [
        'check_box', 'check_box_outline_blank', 'radio_button_checked', 'radio_button_unchecked',
        'toggle_on', 'toggle_off', 'star', 'star_border', 'star_half'
      ]
    },
    {
      name: 'Security',
      icons: [
        'lock', 'lock_open', 'security', 'vpn_key', 'fingerprint',
        'verified_user', 'shield', 'admin_panel_settings', 'https',
        'no_encryption', 'enhanced_encryption', 'password', 'pattern'
      ]
    }
  ];

  allIcons: string[] = [];

  constructor(private elementRef: ElementRef) {
    this.allIcons = this.categories.flatMap(cat => cat.icons);
  }

  ngOnInit(): void {
    this.loadRecentIcons();
    if (this.value) {
      this.customIconName = this.value;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  togglePicker(): void {
    this.isOpen = !this.isOpen;
  }

  selectCategory(categoryName: string): void {
    this.activeCategory = categoryName;
  }

  selectIcon(icon: string): void {
    this.value = icon;
    this.customIconName = icon;
    this.valueChange.emit(icon);
    this.addToRecentIcons(icon);
  }

  filterIcons(): void {
    if (!this.searchQuery) {
      this.filteredIcons = [];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredIcons = this.allIcons.filter(icon =>
      icon.toLowerCase().includes(query)
    );
  }

  getActiveIcons(): string[] {
    const category = this.categories.find(cat => cat.name === this.activeCategory);
    return category ? category.icons : [];
  }

  getDisplayIcons(): string[] {
    return this.searchQuery ? this.filteredIcons : this.getActiveIcons();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredIcons = [];
  }

  clearIcon(): void {
    this.value = '';
    this.customIconName = '';
    this.valueChange.emit('');
    this.isOpen = false;
  }

  applyIcon(): void {
    if (this.customIconName) {
      this.value = this.customIconName;
      this.valueChange.emit(this.customIconName);
      this.onApply.emit(this.customIconName);
      this.addToRecentIcons(this.customIconName);
    }
    this.isOpen = false;
  }

  applyCustomIcon(): void {
    if (this.customIconName) {
      this.selectIcon(this.customIconName);
      this.applyIcon();
    }
  }

  previewCustomIcon(): void {
    // Preview is shown in the button itself
  }

  private addToRecentIcons(icon: string): void {
    if (!icon) return;

    const index = this.recentIcons.indexOf(icon);
    if (index > -1) {
      this.recentIcons.splice(index, 1);
    }

    this.recentIcons.unshift(icon);
    if (this.recentIcons.length > 12) {
      this.recentIcons.pop();
    }

    localStorage.setItem('recentIcons', JSON.stringify(this.recentIcons));
  }

  private loadRecentIcons(): void {
    const stored = localStorage.getItem('recentIcons');
    if (stored) {
      try {
        this.recentIcons = JSON.parse(stored);
      } catch {}
    }
  }
}
