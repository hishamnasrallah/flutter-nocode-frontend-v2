// src/app/features/builder/widget-renderer/widget-renderer.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Widget, WidgetType, CONTAINER_WIDGETS } from '../../../core/models/widget.model';
import { WidgetProperty } from '../../../core/models/property.model';
import { PropertyMapper } from '../../../core/utils/property-mapper';
import { WidgetFactory } from '../../../core/utils/widget-factory';

@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-renderer.component.html',
  styleUrls: ['./widget-renderer.component.scss']
})
export class WidgetRendererComponent implements OnInit, OnChanges {
  @Input() widget!: Widget;
  @Input() isSelected: boolean = false;
  @Input() isHovered: boolean = false;
  @Input() zoom: number = 100;
  @Output() widgetDeleted = new EventEmitter<number>();
  @Output() widgetDuplicated = new EventEmitter<Widget>();

  private computedStyles: any = {};
  private resizeStartData: any = null;

  ngOnInit(): void {
    this.updateStyles();
  }

  ngOnChanges(): void {
    this.updateStyles();
  }

  private updateStyles(): void {
    if (this.widget?.properties) {
      this.computedStyles = PropertyMapper.mapToStyles(this.widget.properties);
    }
  }

  getWidgetStyles(): any {
    const baseStyles = { ...this.computedStyles };

    // Apply zoom for preview
    if (this.zoom !== 100) {
      baseStyles.transform = `scale(${this.zoom / 100})`;
      baseStyles.transformOrigin = 'top left';
    }

    return baseStyles;
  }

  getPropertyValue(propertyName: string): any {
    if (!this.widget.properties) return null;

    const property = this.widget.properties.find(p => p.property_name === propertyName);
    if (!property) return null;

    // Return the appropriate value based on property type
    switch (property.property_type) {
      case 'string':
        return property.string_value;
      case 'integer':
        return property.integer_value;
      case 'decimal':
        return property.decimal_value;
      case 'boolean':
        return property.boolean_value;
      case 'color':
        return property.color_value;
      case 'alignment':
        return property.alignment_value;
      case 'url':
        return property.url_value;
      case 'json':
        return property.json_value ? JSON.parse(property.json_value) : null;
      default:
        return null;
    }
  }

  // Widget-specific style getters
  getFlexStyles(): any {
    const styles: any = {};

    const mainAxisAlignment = this.getPropertyValue('mainAxisAlignment');
    const crossAxisAlignment = this.getPropertyValue('crossAxisAlignment');
    const mainAxisSize = this.getPropertyValue('mainAxisSize');

    // Map Flutter alignment to CSS
    if (mainAxisAlignment) {
      const alignMap: any = {
        'start': 'flex-start',
        'end': 'flex-end',
        'center': 'center',
        'spaceBetween': 'space-between',
        'spaceAround': 'space-around',
        'spaceEvenly': 'space-evenly'
      };
      styles.justifyContent = alignMap[mainAxisAlignment] || 'flex-start';
    }

    if (crossAxisAlignment) {
      const alignMap: any = {
        'start': 'flex-start',
        'end': 'flex-end',
        'center': 'center',
        'stretch': 'stretch'
      };
      styles.alignItems = alignMap[crossAxisAlignment] || 'stretch';
    }

    if (mainAxisSize === 'min') {
      styles.width = 'fit-content';
    }

    return { ...this.computedStyles, ...styles };
  }

  getContainerStyles(): any {
    const styles: any = { ...this.computedStyles };

    const alignment = this.getPropertyValue('alignment');
    if (alignment) {
      styles.display = 'flex';
      styles.alignItems = 'center';
      styles.justifyContent = 'center';
    }

    const borderWidth = this.getPropertyValue('borderWidth');
    const borderColor = this.getPropertyValue('borderColor');
    if (borderWidth) {
      styles.borderWidth = `${borderWidth}px`;
      styles.borderStyle = 'solid';
      styles.borderColor = borderColor || '#e0e0e0';
    }

    return styles;
  }

  getTextStyles(): any {
    const styles: any = { ...this.computedStyles };

    const fontStyle = this.getPropertyValue('fontStyle');
    if (fontStyle === 'italic') {
      styles.fontStyle = 'italic';
    }

    const textDecoration = this.getPropertyValue('textDecoration');
    if (textDecoration) {
      styles.textDecoration = textDecoration;
    }

    const letterSpacing = this.getPropertyValue('letterSpacing');
    if (letterSpacing) {
      styles.letterSpacing = `${letterSpacing}px`;
    }

    const lineHeight = this.getPropertyValue('lineHeight');
    if (lineHeight) {
      styles.lineHeight = lineHeight;
    }

    const overflow = this.getPropertyValue('overflow');
    if (overflow) {
      switch (overflow) {
        case 'clip':
          styles.overflow = 'hidden';
          styles.textOverflow = 'clip';
          break;
        case 'fade':
          styles.overflow = 'hidden';
          styles.textOverflow = 'fade';
          break;
        case 'ellipsis':
          styles.overflow = 'hidden';
          styles.textOverflow = 'ellipsis';
          styles.whiteSpace = 'nowrap';
          break;
        case 'visible':
          styles.overflow = 'visible';
          break;
      }
    }

    return styles;
  }

  getImageStyles(): any {
    const styles: any = {};

    const fit = this.getPropertyValue('fit');
    if (fit) {
      switch (fit) {
        case 'cover':
          styles.objectFit = 'cover';
          break;
        case 'contain':
          styles.objectFit = 'contain';
          break;
        case 'fill':
          styles.objectFit = 'fill';
          break;
        case 'fitWidth':
          styles.width = '100%';
          styles.height = 'auto';
          break;
        case 'fitHeight':
          styles.width = 'auto';
          styles.height = '100%';
          break;
        case 'none':
          styles.objectFit = 'none';
          break;
        case 'scaleDown':
          styles.objectFit = 'scale-down';
          break;
      }
    }

    return { ...this.computedStyles, ...styles };
  }

  getIconStyles(): any {
    const styles: any = { ...this.computedStyles };

    const size = this.getPropertyValue('size');
    if (size) {
      styles.fontSize = `${size}px`;
    }

    const color = this.getPropertyValue('color');
    if (color) {
      styles.color = color;
    }

    return styles;
  }

  getButtonStyles(): any {
    const styles: any = { ...this.computedStyles };

    const backgroundColor = this.getPropertyValue('backgroundColor');
    const foregroundColor = this.getPropertyValue('foregroundColor');
    const elevation = this.getPropertyValue('elevation');

    if (backgroundColor) {
      styles.background = backgroundColor;
    }

    if (foregroundColor) {
      styles.color = foregroundColor;
    }

    if (elevation) {
      styles.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.${Math.min(elevation * 3, 30)})`;
    }

    return styles;
  }

  getTextButtonStyles(): any {
    const styles: any = { ...this.computedStyles };

    const textColor = this.getPropertyValue('textColor');
    if (textColor) {
      styles.color = textColor;
    }

    return styles;
  }

  getIconButtonStyles(): any {
    const styles: any = { ...this.computedStyles };

    const iconColor = this.getPropertyValue('iconColor');
    const iconSize = this.getPropertyValue('iconSize');

    if (iconColor) {
      styles.color = iconColor;
    }

    if (iconSize) {
      styles.fontSize = `${iconSize}px`;
    }

    return styles;
  }

  getCardStyles(): any {
    const styles: any = { ...this.computedStyles };

    const elevation = this.getPropertyValue('elevation');
    if (elevation) {
      styles.boxShadow = `0 ${elevation}px ${elevation * 3}px rgba(0, 0, 0, 0.${Math.min(elevation * 5, 30)})`;
    }

    const borderRadius = this.getPropertyValue('borderRadius');
    if (borderRadius !== undefined) {
      styles.borderRadius = `${borderRadius}px`;
    }

    return styles;
  }

  getPaddingStyles(): any {
    const styles: any = { ...this.computedStyles };

    const paddingTop = this.getPropertyValue('paddingTop');
    const paddingRight = this.getPropertyValue('paddingRight');
    const paddingBottom = this.getPropertyValue('paddingBottom');
    const paddingLeft = this.getPropertyValue('paddingLeft');

    if (paddingTop !== undefined || paddingRight !== undefined ||
        paddingBottom !== undefined || paddingLeft !== undefined) {
      styles.paddingTop = `${paddingTop || 0}px`;
      styles.paddingRight = `${paddingRight || 0}px`;
      styles.paddingBottom = `${paddingBottom || 0}px`;
      styles.paddingLeft = `${paddingLeft || 0}px`;
    }

    return styles;
  }

  getSizedBoxStyles(): any {
    const styles: any = {};

    const width = this.getPropertyValue('width');
    const height = this.getPropertyValue('height');

    if (width) {
      styles.width = `${width}px`;
    }

    if (height) {
      styles.height = `${height}px`;
    }

    return styles;
  }

  getAspectRatioStyles(): any {
    const styles: any = {};

    const aspectRatio = this.getPropertyValue('aspectRatio');
    if (aspectRatio) {
      styles.aspectRatio = aspectRatio;
    }

    return styles;
  }

  getTextFieldStyles(): any {
    const styles: any = { ...this.computedStyles };

    const filled = this.getPropertyValue('filled');
    const fillColor = this.getPropertyValue('fillColor');
    const borderStyle = this.getPropertyValue('borderStyle');

    if (filled && fillColor) {
      styles.backgroundColor = fillColor;
    }

    if (borderStyle === 'none') {
      styles.border = 'none';
    } else if (borderStyle === 'underline') {
      styles.borderTop = 'none';
      styles.borderLeft = 'none';
      styles.borderRight = 'none';
      styles.borderBottom = '2px solid #667eea';
      styles.borderRadius = '0';
    }

    return styles;
  }

  getDividerStyles(): any {
    const styles: any = {};

    const color = this.getPropertyValue('color');
    const thickness = this.getPropertyValue('thickness');
    const indent = this.getPropertyValue('indent');
    const endIndent = this.getPropertyValue('endIndent');

    if (color) {
      styles.backgroundColor = color;
    }

    if (thickness) {
      styles.height = `${thickness}px`;
    }

    if (indent) {
      styles.marginLeft = `${indent}px`;
    }

    if (endIndent) {
      styles.marginRight = `${endIndent}px`;
    }

    return styles;
  }

  getListTileStyles(): any {
    const styles: any = { ...this.computedStyles };

    const tileColor = this.getPropertyValue('tileColor');
    const contentPadding = this.getPropertyValue('contentPadding');

    if (tileColor) {
      styles.backgroundColor = tileColor;
    }

    if (contentPadding) {
      styles.padding = `${contentPadding}px`;
    }

    return styles;
  }

  getGridViewStyles(): any {
    const styles: any = { ...this.computedStyles };

    const crossAxisCount = this.getPropertyValue('crossAxisCount') || 2;
    const crossAxisSpacing = this.getPropertyValue('crossAxisSpacing') || 8;
    const mainAxisSpacing = this.getPropertyValue('mainAxisSpacing') || 8;

    styles.gridTemplateColumns = `repeat(${crossAxisCount}, 1fr)`;
    styles.gap = `${mainAxisSpacing}px ${crossAxisSpacing}px`;

    return styles;
  }

  getAppBarStyles(): any {
    const styles: any = { ...this.computedStyles };

    const backgroundColor = this.getPropertyValue('backgroundColor');
    const elevation = this.getPropertyValue('elevation');

    if (backgroundColor) {
      styles.backgroundColor = backgroundColor;
    }

    if (elevation) {
      styles.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0, 0, 0, 0.${Math.min(elevation * 5, 30)})`;
    }

    return styles;
  }

  getBottomNavStyles(): any {
    const styles: any = { ...this.computedStyles };

    const backgroundColor = this.getPropertyValue('backgroundColor');
    const selectedItemColor = this.getPropertyValue('selectedItemColor');

    if (backgroundColor) {
      styles.backgroundColor = backgroundColor;
    }

    if (selectedItemColor) {
      styles['--selected-color'] = selectedItemColor;
    }

    return styles;
  }

  getTabBarStyles(): any {
    const styles: any = { ...this.computedStyles };

    const indicatorColor = this.getPropertyValue('indicatorColor');
    const labelColor = this.getPropertyValue('labelColor');

    if (indicatorColor) {
      styles['--indicator-color'] = indicatorColor;
    }

    if (labelColor) {
      styles.color = labelColor;
    }

    return styles;
  }

  // Resize functionality
  canResize(): boolean {
    // Only certain widgets can be resized
    const resizableTypes: WidgetType[] = [
      'Container', 'SizedBox', 'Image', 'Card', 'TextField',
      'ElevatedButton', 'ListView', 'GridView'
    ];
    return resizableTypes.includes(this.widget.widget_type);
  }

  startResize(event: MouseEvent, handle: string): void {
    event.preventDefault();
    event.stopPropagation();

    const element = (event.target as HTMLElement).closest('.widget-container') as HTMLElement;
    const rect = element.getBoundingClientRect();

    this.resizeStartData = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      startTop: rect.top
    };

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  private onResize = (event: MouseEvent): void => {
    if (!this.resizeStartData) return;

    const deltaX = event.clientX - this.resizeStartData.startX;
    const deltaY = event.clientY - this.resizeStartData.startY;

    let newWidth = this.resizeStartData.startWidth;
    let newHeight = this.resizeStartData.startHeight;

    // Calculate new dimensions based on handle
    switch (this.resizeStartData.handle) {
      case 'right':
        newWidth = this.resizeStartData.startWidth + deltaX;
        break;
      case 'bottom':
        newHeight = this.resizeStartData.startHeight + deltaY;
        break;
      case 'bottom-right':
        newWidth = this.resizeStartData.startWidth + deltaX;
        newHeight = this.resizeStartData.startHeight + deltaY;
        break;
      // Add other handle cases as needed
    }

    // Update widget properties (emit event to parent)
    this.updateWidgetSize(newWidth, newHeight);
  };

  private stopResize = (): void => {
    this.resizeStartData = null;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  };

  private updateWidgetSize(width: number, height: number): void {
    // This would emit an event to update the widget properties
    // For now, we'll just update the styles locally
    this.computedStyles.width = `${width}px`;
    this.computedStyles.height = `${height}px`;
  }

  // Widget actions
  onDelete(): void {
    if (confirm('Delete this widget?')) {
      this.widgetDeleted.emit(this.widget.id);
    }
  }

  onDuplicate(): void {
    this.widgetDuplicated.emit(this.widget);
  }

  onChildDeleted(widgetId: number): void {
    this.widgetDeleted.emit(widgetId);
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    // Could show a context menu here
  }

  renderContent(): string {
    // Return placeholder content for widgets
    switch (this.widget.widget_type) {
      case 'Text':
        return this.getPropertyValue('text') || 'Sample Text';
      case 'ElevatedButton':
      case 'TextButton':
        return this.getPropertyValue('text') || 'Button';
      default:
        return '';
    }
  }
}
