'use client';

import React from 'react';
import { Tag } from 'antd';
import type { EstadoFactura } from '@/lib/types';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';

export function EstadoFacturaBadge({ estado }: { estado: EstadoFactura }) {
  switch (estado) {
    case 'COTIZACION':
      return (
        <Tag
          icon={<FileTextOutlined />}
          color="blue"
          className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-lg border-blue-200"
        >
          Cotización
        </Tag>
      );
    case 'BORRADOR':
      return (
        <Tag
          color="default"
          className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-lg"
        >
          Borrador
        </Tag>
      );
    case 'EMITIDA':
      return (
        <Tag
          icon={<ClockCircleOutlined />}
          className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-lg border-sky-300 text-[#0066B3] bg-sky-50"
        >
          Por Cobrar
        </Tag>
      );
    case 'PAGADA_PARCIAL':
      return (
        <Tag
          icon={<DollarOutlined />}
          color="purple"
          className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-lg"
        >
          Abonada
        </Tag>
      );
    case 'PAGADA':
      return (
        <Tag
          icon={<CheckCircleOutlined />}
          color="success"
          className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-lg border-emerald-300 text-emerald-900 bg-emerald-50"
        >
          Pagada
        </Tag>
      );
    case 'ANULADA':
      return (
        <Tag
          icon={<CloseCircleOutlined />}
          color="error"
          className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-lg"
        >
          Anulada
        </Tag>
      );
    default:
      return <Tag className="font-bold text-[11px] uppercase">{estado}</Tag>;
  }
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}) {
  const colorMap = {
    default: 'default',
    info: 'blue',
    success: 'success',
    warning: 'warning',
    danger: 'error',
    purple: 'purple',
  } as const;

  return (
    <Tag color={colorMap[variant]} className="font-bold text-[11px] uppercase px-2.5 py-0.5 rounded-lg">
      {children}
    </Tag>
  );
}
