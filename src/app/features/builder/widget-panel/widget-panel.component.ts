// src/app/features/builder/widget-panel/widget-panel.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DraggableDirective } from '../../../core/directives/draggable.directive';
import { WidgetService } from '../../../core/services/widget.service';
import { WidgetCategory } from '../../../core/models/widget.model';

@Component({
  selector: 'app-widget-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DraggableDirective],
  templateUrl: './widget-panel.component.html',
  styleUrls: ['./widget-panel.component.scss']
})
export class WidgetPanelComponent implements OnInit {
  widgetCategories: WidgetCategory[] = [];
  searchQuery = '';
  filteredCategories: WidgetCategory[] = [];
  expandedCategories: Set<string> = new Set();

  constructor(private widgetService: WidgetService) {}

  ngOnInit(): void {
    this.widgetCategories = this.widgetService.getWidgetCategories();
    this.filteredCategories = [...this.widgetCategories];

    // Expand first category by default
    if (this.widgetCategories.length > 0) {
      this.expandedCategories.add(this.widgetCategories[0].name);
    }
  }

  onSearchChange(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCategories = [...this.widgetCategories];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredCategories = this.widgetCategories
        .map(category => ({
          ...category,
          widgets: category.widgets.filter(widget =>
            widget.type.toLowerCase().includes(query) ||
            widget.description.toLowerCase().includes(query)
          )
        }))
        .filter(category => category.widgets.length > 0);

      // Expand all categories when searching
      this.filteredCategories.forEach(cat => {
        this.expandedCategories.add(cat.name);
      });
    }
  }

  toggleCategory(categoryName: string): void {
    if (this.expandedCategories.has(categoryName)) {
      this.expandedCategories.delete(categoryName);
    } else {
      this.expandedCategories.add(categoryName);
    }
  }

  isCategoryExpanded(categoryName: string): boolean {
    return this.expandedCategories.has(categoryName);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }
}
