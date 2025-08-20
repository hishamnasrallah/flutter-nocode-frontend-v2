// src/app/features/builder/device-frame/device-frame.component.ts

import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DeviceSpec {
  width: number;
  height: number;
  statusBarHeight: number;
  homeIndicatorHeight: number;
  borderRadius: number;
  bezelColor: string;
  screenColor?: string;
  hasHomeButton?: boolean;
}

@Component({
  selector: 'app-device-frame',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-frame.component.html',
  styleUrls: ['./device-frame.component.scss']
})
export class DeviceFrameComponent implements OnInit, OnChanges {
  @Input() deviceType: string = 'iphone14';
  @Input() zoom: number = 100;

  devices: Record<string, DeviceSpec> = {
    'iphone14': {
      width: 390,
      height: 844,
      statusBarHeight: 47,
      homeIndicatorHeight: 34,
      borderRadius: 47,
      bezelColor: '#000000',
      screenColor: '#000000'
    },
    'iphone14pro': {
      width: 393,
      height: 852,
      statusBarHeight: 54,
      homeIndicatorHeight: 34,
      borderRadius: 55,
      bezelColor: '#403E41',
      screenColor: '#000000'
    },
    'iphonese': {
      width: 375,
      height: 667,
      statusBarHeight: 20,
      homeIndicatorHeight: 0,
      borderRadius: 0,
      bezelColor: '#000000',
      hasHomeButton: true
    },
    'android': {
      width: 360,
      height: 800,
      statusBarHeight: 24,
      homeIndicatorHeight: 48,
      borderRadius: 20,
      bezelColor: '#333333'
    },
    'ipad': {
      width: 768,
      height: 1024,
      statusBarHeight: 20,
      homeIndicatorHeight: 20,
      borderRadius: 18,
      bezelColor: '#000000'
    }
  };

  currentDevice!: DeviceSpec;
  currentTime: string = '';
  private timeInterval: any;

  ngOnInit(): void {
    this.updateDevice();
    this.startTimeUpdate();
  }

  ngOnChanges(): void {
    this.updateDevice();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateDevice(): void {
    this.currentDevice = this.devices[this.deviceType] || this.devices['iphone14'];
  }

  private startTimeUpdate(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  getCurrentTime(): string {
    return this.currentTime || '09:41'; // iOS default time
  }

  getScale(): number {
    return this.zoom / 100;
  }

  hasNotch(): boolean {
    return this.deviceType === 'iphone14' || this.deviceType === 'iphone14pro';
  }

  getScreenBorderRadius(): number {
    if (this.currentDevice.borderRadius > 0) {
      return this.currentDevice.borderRadius - 12; // Slightly less than bezel
    }
    return 0;
  }

  getStatusBarPadding(): number {
    if (this.hasNotch()) {
      return this.deviceType === 'iphone14pro' ? 8 : 5;
    }
    return 0;
  }
}
