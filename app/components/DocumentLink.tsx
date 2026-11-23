import type { AnchorHTMLAttributes, ReactNode } from 'react';

/** Full document navigations avoid the reproduced Next.js soft-navigation
 * `__next_error__` on Android/in-app browsers, without changing routes,
 * payments, cart state storage or account permissions. */
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode };
export default function DocumentLink({ href, children, ...props }: Props) {
  return <a href={href} {...props}>{children}</a>;
}
