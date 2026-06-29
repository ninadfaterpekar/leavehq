import { AriaAttributes, DOMAttributes } from 'react'

type CustomElement<T = {}> = Partial<
  T & DOMAttributes<T> & AriaAttributes & { children: React.ReactNode; class: string; style: React.CSSProperties; key: React.Key }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'rel-topbar': CustomElement<{ variant?: string; sticky?: boolean | string; compact?: boolean | string }>
      'rel-topbar-brand': CustomElement<{ label?: string; href?: string; src?: string }>
      'rel-topbar-item': CustomElement<{ label?: string; href?: string; active?: string | boolean; disabled?: boolean }>
      'rel-topbar-profile': CustomElement<{ type?: string; initials?: string; name?: string; subtitle?: string; compact?: boolean }>
      'rel-topbar-actions': CustomElement
      'rel-topbar-utilities': CustomElement
      'rel-topbar-mobile-panel': CustomElement
      'rel-card': CustomElement
      'rel-button': CustomElement<{ variant?: string; tone?: string; size?: string; disabled?: boolean; onClick?: any }>
      'rel-chip': CustomElement<{ label?: string; tone?: string; variant?: string; size?: string; removable?: boolean }>
      'rel-badge': CustomElement<{ number?: string; variant?: string; size?: string; color?: string }>
      'rel-avatar': CustomElement<{ type?: string; variant?: string; size?: string; text?: string; src?: string; alt?: string }>
      'rel-alert': CustomElement<{ type?: string; message1?: string; message2?: string; dismissible?: boolean }>
      'rel-container': CustomElement<{ padding?: string; shadow?: boolean; background?: string }>
      'rel-layout': CustomElement<{ gap?: string; columns?: number; responsive?: boolean }>
      'rel-divider': CustomElement<{ orientation?: string }>
      'rel-textfield': CustomElement<{ label?: string; placeholder?: string; value?: string; type?: string; disabled?: boolean; required?: boolean; error?: string; size?: string }>
      'rel-select': CustomElement<{ label?: string; placeholder?: string; value?: string; disabled?: boolean; required?: boolean; options?: any }>
    }
  }
}

export {}
