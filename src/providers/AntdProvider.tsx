'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            colorPrimary: '#0066B3',
            colorPrimaryHover: '#005291',
            colorPrimaryActive: '#003D6B',
            colorLink: '#0066B3',
            colorLinkHover: '#005291',
            colorWarning: '#F59E0B',
            colorWarningHover: '#D97706',
            colorSuccess: '#10B981',
            colorError: '#EF4444',
            colorInfo: '#0284C7',
            borderRadius: 0,
            borderRadiusLG: 0,
            borderRadiusSM: 0,
            borderRadiusXS: 0,
            controlHeight: 40,
            fontFamily:
              'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          components: {
            Button: {
              borderRadius: 0,
              fontWeight: 700,
              controlHeight: 40,
              primaryShadow: '0 4px 14px 0 rgba(0, 102, 179, 0.35)',
            },
            Select: {
              borderRadius: 0,
              controlHeight: 40,
            },
            Input: {
              borderRadius: 0,
              controlHeight: 40,
            },
            InputNumber: {
              borderRadius: 0,
              controlHeight: 40,
            },
            Modal: {
              borderRadiusLG: 0,
            },
            Drawer: {
              borderRadiusLG: 0,
            },
            Table: {
              borderRadius: 0,
              headerBg: 'rgba(241, 245, 249, 0.75)',
              headerColor: '#1E293B',
              rowHoverBg: 'rgba(224, 242, 254, 0.45)',
            },
            Segmented: {
              borderRadius: 0,
              trackBg: '#E2E8F0',
              itemSelectedBg: '#0066B3',
              itemSelectedColor: '#FFFFFF',
              itemHoverColor: '#0066B3',
            },
            Tag: {
              borderRadiusSM: 0,
            },
            Card: {
              borderRadiusLG: 0,
            },
            Popover: {
              borderRadius: 0,
            },
            Tooltip: {
              borderRadius: 0,
            },
            Dropdown: {
              borderRadiusLG: 0,
            },
            DatePicker: {
              borderRadius: 0,
            },
            Alert: {
              borderRadiusLG: 0,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
