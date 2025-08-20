// src/app/core/utils/property-mapper.ts

import { WidgetProperty } from '../models/property.model';
import { Widget } from '../models/widget.model';

export class PropertyMapper {
  /**
   * Convert Flutter properties to CSS styles
   */
  static mapToStyles(properties: WidgetProperty[]): any {
    const styles: any = {};

    properties.forEach(prop => {
      switch (prop.property_name) {
        // Dimension properties
        case 'width':
          if (prop.decimal_value !== undefined && prop.decimal_value !== null) {
            styles.width = `${prop.decimal_value}px`;
          }
          break;

        case 'height':
          if (prop.decimal_value !== undefined && prop.decimal_value !== null) {
            styles.height = `${prop.decimal_value}px`;
          }
          break;

        case 'minWidth':
          if (prop.decimal_value !== undefined) {
            styles.minWidth = `${prop.decimal_value}px`;
          }
          break;

        case 'minHeight':
          if (prop.decimal_value !== undefined) {
            styles.minHeight = `${prop.decimal_value}px`;
          }
          break;

        case 'maxWidth':
          if (prop.decimal_value !== undefined) {
            styles.maxWidth = `${prop.decimal_value}px`;
          }
          break;

        case 'maxHeight':
          if (prop.decimal_value !== undefined) {
            styles.maxHeight = `${prop.decimal_value}px`;
          }
          break;

        // Spacing properties
        case 'padding':
          if (prop.decimal_value !== undefined) {
            styles.padding = `${prop.decimal_value}px`;
          }
          break;

        case 'margin':
          if (prop.decimal_value !== undefined) {
            styles.margin = `${prop.decimal_value}px`;
          }
          break;

        // Color properties
        case 'color':
        case 'backgroundColor':
          if (prop.color_value) {
            styles.backgroundColor = prop.color_value;
          }
          break;

        case 'textColor':
        case 'foregroundColor':
          if (prop.color_value) {
            styles.color = prop.color_value;
          }
          break;

        case 'borderColor':
          if (prop.color_value) {
            styles.borderColor = prop.color_value;
          }
          break;

        // Text properties
        case 'fontSize':
          if (prop.decimal_value !== undefined) {
            styles.fontSize = `${prop.decimal_value}px`;
          }
          break;

        case 'fontWeight':
          if (prop.string_value) {
            const weights: Record<string, number> = {
              'normal': 400,
              'bold': 700,
              'w100': 100,
              'w200': 200,
              'w300': 300,
              'w400': 400,
              'w500': 500,
              'w600': 600,
              'w700': 700,
              'w800': 800,
              'w900': 900
            };
            styles.fontWeight = weights[prop.string_value] || 400;
          }
          break;

        case 'textAlign':
          if (prop.alignment_value) {
            styles.textAlign = this.mapTextAlignment(prop.alignment_value);
          }
          break;

        case 'fontStyle':
          if (prop.string_value === 'italic') {
            styles.fontStyle = 'italic';
          }
          break;

        case 'letterSpacing':
          if (prop.decimal_value !== undefined) {
            styles.letterSpacing = `${prop.decimal_value}px`;
          }
          break;

        case 'lineHeight':
          if (prop.decimal_value !== undefined) {
            styles.lineHeight = prop.decimal_value;
          }
          break;

        // Border properties
        case 'borderRadius':
          if (prop.decimal_value !== undefined) {
            styles.borderRadius = `${prop.decimal_value}px`;
          }
          break;

        case 'borderWidth':
          if (prop.decimal_value !== undefined) {
            styles.borderWidth = `${prop.decimal_value}px`;
            styles.borderStyle = 'solid';
          }
          break;

        // Shadow properties
        case 'elevation':
          if (prop.integer_value !== undefined && prop.integer_value > 0) {
            const elevation = prop.integer_value;
            styles.boxShadow = this.getElevationShadow(elevation);
          }
          break;

        // Opacity
        case 'opacity':
          if (prop.decimal_value !== undefined) {
            styles.opacity = prop.decimal_value;
          }
          break;

        // Transform properties
        case 'rotation':
          if (prop.decimal_value !== undefined) {
            styles.transform = `rotate(${prop.decimal_value}deg)`;
          }
          break;

        case 'scale':
          if (prop.decimal_value !== undefined) {
            styles.transform = `scale(${prop.decimal_value})`;
          }
          break;

        // Visibility
        case 'visible':
          if (prop.boolean_value === false) {
            styles.display = 'none';
          }
          break;

        // Z-index
        case 'zIndex':
          if (prop.integer_value !== undefined) {
            styles.zIndex = prop.integer_value;
          }
          break;
      }
    });

    return styles;
  }

  /**
   * Map Flutter alignment to CSS
   */
  static mapAlignment(alignment: string): any {
    const alignmentMap: Record<string, any> = {
      'center': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      },
      'centerLeft': {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center'
      },
      'centerRight': {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center'
      },
      'topLeft': {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
      },
      'topCenter': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      },
      'topRight': {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start'
      },
      'bottomLeft': {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-end'
      },
      'bottomCenter': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end'
      },
      'bottomRight': {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end'
      }
    };

    return alignmentMap[alignment] || alignmentMap['center'];
  }

  /**
   * Map Flutter text alignment to CSS
   */
  static mapTextAlignment(alignment: string): string {
    const textAlignMap: Record<string, string> = {
      'left': 'left',
      'right': 'right',
      'center': 'center',
      'justify': 'justify',
      'start': 'left',
      'end': 'right'
    };

    return textAlignMap[alignment] || 'left';
  }

  /**
   * Map Flutter flex properties to CSS flexbox
   */
  static mapFlexProperties(widget: Widget): any {
    const styles: any = {};
    const properties = widget.properties || [];

    // Get flex direction based on widget type
    if (widget.widget_type === 'Column') {
      styles.display = 'flex';
      styles.flexDirection = 'column';
    } else if (widget.widget_type === 'Row') {
      styles.display = 'flex';
      styles.flexDirection = 'row';
    }

    // Map main axis alignment
    const mainAxisAlignment = properties.find(p => p.property_name === 'mainAxisAlignment');
    if (mainAxisAlignment?.string_value) {
      const alignmentMap: Record<string, string> = {
        'start': 'flex-start',
        'end': 'flex-end',
        'center': 'center',
        'spaceBetween': 'space-between',
        'spaceAround': 'space-around',
        'spaceEvenly': 'space-evenly'
      };
      styles.justifyContent = alignmentMap[mainAxisAlignment.string_value] || 'flex-start';
    }

    // Map cross axis alignment
    const crossAxisAlignment = properties.find(p => p.property_name === 'crossAxisAlignment');
    if (crossAxisAlignment?.string_value) {
      const alignmentMap: Record<string, string> = {
        'start': 'flex-start',
        'end': 'flex-end',
        'center': 'center',
        'stretch': 'stretch',
        'baseline': 'baseline'
      };
      styles.alignItems = alignmentMap[crossAxisAlignment.string_value] || 'stretch';
    }

    // Map main axis size
    const mainAxisSize = properties.find(p => p.property_name === 'mainAxisSize');
    if (mainAxisSize?.string_value === 'min') {
      if (widget.widget_type === 'Column') {
        styles.height = 'fit-content';
      } else {
        styles.width = 'fit-content';
      }
    }

    return styles;
  }

  /**
   * Generate elevation shadow
   */
  private static getElevationShadow(elevation: number): string {
    // Material Design elevation shadows approximation
    const shadows: Record<number, string> = {
      1: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      2: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      3: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      4: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      5: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
      6: '0 24px 48px rgba(0,0,0,0.35), 0 20px 14px rgba(0,0,0,0.22)',
      8: '0 32px 64px rgba(0,0,0,0.40), 0 28px 18px rgba(0,0,0,0.22)',
      12: '0 48px 96px rgba(0,0,0,0.45), 0 42px 22px rgba(0,0,0,0.22)',
      16: '0 64px 128px rgba(0,0,0,0.50), 0 56px 26px rgba(0,0,0,0.22)',
      24: '0 96px 192px rgba(0,0,0,0.55), 0 84px 30px rgba(0,0,0,0.22)'
    };

    // Find the closest elevation value
    const elevationKeys = Object.keys(shadows).map(Number).sort((a, b) => a - b);
    let closestElevation = elevationKeys[0];

    for (const key of elevationKeys) {
      if (key <= elevation) {
        closestElevation = key;
      } else {
        break;
      }
    }

    return shadows[closestElevation] || shadows[1];
  }

  /**
   * Map Flutter EdgeInsets to CSS padding/margin
   */
  static mapEdgeInsets(edgeInsets: string): string {
    // Parse EdgeInsets format: "EdgeInsets.all(16)" or "EdgeInsets.only(left: 16, top: 8)"
    if (edgeInsets.includes('all')) {
      const match = edgeInsets.match(/\d+/);
      if (match) {
        return `${match[0]}px`;
      }
    }

    if (edgeInsets.includes('only')) {
      const values = {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      };

      const topMatch = edgeInsets.match(/top:\s*(\d+)/);
      if (topMatch) values.top = topMatch[1];

      const rightMatch = edgeInsets.match(/right:\s*(\d+)/);
      if (rightMatch) values.right = rightMatch[1];

      const bottomMatch = edgeInsets.match(/bottom:\s*(\d+)/);
      if (bottomMatch) values.bottom = bottomMatch[1];

      const leftMatch = edgeInsets.match(/left:\s*(\d+)/);
      if (leftMatch) values.left = leftMatch[1];

      return `${values.top}px ${values.right}px ${values.bottom}px ${values.left}px`;
    }

    if (edgeInsets.includes('symmetric')) {
      const horizontalMatch = edgeInsets.match(/horizontal:\s*(\d+)/);
      const verticalMatch = edgeInsets.match(/vertical:\s*(\d+)/);

      const horizontal = horizontalMatch ? horizontalMatch[1] : '0';
      const vertical = verticalMatch ? verticalMatch[1] : '0';

      return `${vertical}px ${horizontal}px`;
    }

    return '0';
  }

  /**
   * Map Flutter BoxDecoration to CSS
   */
  static mapBoxDecoration(decoration: any): any {
    const styles: any = {};

    if (decoration.color) {
      styles.backgroundColor = decoration.color;
    }

    if (decoration.borderRadius) {
      styles.borderRadius = `${decoration.borderRadius}px`;
    }

    if (decoration.border) {
      styles.border = `${decoration.border.width || 1}px solid ${decoration.border.color || '#000000'}`;
    }

    if (decoration.boxShadow) {
      styles.boxShadow = decoration.boxShadow.map((shadow: any) =>
        `${shadow.offsetX || 0}px ${shadow.offsetY || 0}px ${shadow.blurRadius || 0}px ${shadow.spreadRadius || 0}px ${shadow.color || 'rgba(0,0,0,0.25)'}`
      ).join(', ');
    }

    if (decoration.gradient) {
      const gradient = decoration.gradient;
      if (gradient.type === 'linear') {
        const angle = gradient.angle || 0;
        const colors = gradient.colors || ['#ffffff', '#000000'];
        styles.background = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
      } else if (gradient.type === 'radial') {
        const colors = gradient.colors || ['#ffffff', '#000000'];
        styles.background = `radial-gradient(circle, ${colors.join(', ')})`;
      }
    }

    return styles;
  }

  /**
   * Map Flutter TextStyle to CSS
   */
  static mapTextStyle(textStyle: any): any {
    const styles: any = {};

    if (textStyle.fontSize) {
      styles.fontSize = `${textStyle.fontSize}px`;
    }

    if (textStyle.fontWeight) {
      styles.fontWeight = textStyle.fontWeight;
    }

    if (textStyle.fontStyle) {
      styles.fontStyle = textStyle.fontStyle;
    }

    if (textStyle.color) {
      styles.color = textStyle.color;
    }

    if (textStyle.letterSpacing) {
      styles.letterSpacing = `${textStyle.letterSpacing}px`;
    }

    if (textStyle.wordSpacing) {
      styles.wordSpacing = `${textStyle.wordSpacing}px`;
    }

    if (textStyle.height) {
      styles.lineHeight = textStyle.height;
    }

    if (textStyle.decoration) {
      const decorations = [];
      if (textStyle.decoration.includes('underline')) decorations.push('underline');
      if (textStyle.decoration.includes('overline')) decorations.push('overline');
      if (textStyle.decoration.includes('lineThrough')) decorations.push('line-through');
      styles.textDecoration = decorations.join(' ');
    }

    if (textStyle.decorationColor) {
      styles.textDecorationColor = textStyle.decorationColor;
    }

    if (textStyle.decorationStyle) {
      const styleMap: Record<string, string> = {
        'solid': 'solid',
        'double': 'double',
        'dotted': 'dotted',
        'dashed': 'dashed',
        'wavy': 'wavy'
      };
      styles.textDecorationStyle = styleMap[textStyle.decorationStyle] || 'solid';
    }

    if (textStyle.shadows) {
      styles.textShadow = textStyle.shadows.map((shadow: any) =>
        `${shadow.offsetX || 0}px ${shadow.offsetY || 0}px ${shadow.blurRadius || 0}px ${shadow.color || 'rgba(0,0,0,0.25)'}`
      ).join(', ');
    }

    return styles;
  }
}
