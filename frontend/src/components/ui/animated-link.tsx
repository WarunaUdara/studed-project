import { Link } from "@tanstack/react-router";
import type React from "react";
import { cn } from "@/lib/utils";

interface AnimatedLinkProps {
  children: React.ReactNode;
  to?: string;
  href?: string;
  className?: string;
  target?: string;
  rel?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn(
      "ml-[0.3em] size-[0.55em] transition-all duration-300 [motion-reduce:transition-none]",
      className,
    )}
    fill="none"
    viewBox="0 0 10 10"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Base wrapper that renders TanStack Router <Link> if `to` is passed,
 * or an anchor <a> if `href` is passed.
 */
function BaseLink({
  to,
  href,
  className,
  children,
  target,
  rel,
  title,
  onClick,
}: AnimatedLinkProps) {
  if (to) {
    return (
      <Link to={to} className={className} title={title} onClick={onClick} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href ?? "#"}
      className={className}
      target={target}
      rel={rel}
      title={title}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

/**
 * Link000: Underline expansion from right to left on hover
 */
export const Link000 = ({ children, to, href, className, ...props }: AnimatedLinkProps) => {
  return (
    <BaseLink
      to={to}
      href={href}
      className={cn(
        "group relative inline-flex items-center",
        "before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[0.05em] before:w-full before:bg-current before:content-['']",
        "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] [motion-reduce:before:transition-none]",
        "hover:before:origin-left hover:before:scale-x-100",
        className,
      )}
      {...props}
    >
      {children}
    </BaseLink>
  );
};

/**
 * Link001: Underline with gliding arrow icon appearing on hover
 */
export const Link001 = ({ children, to, href, className, ...props }: AnimatedLinkProps) => {
  return (
    <BaseLink
      to={to}
      href={href}
      className={cn(
        "group relative inline-flex items-center",
        "before:pointer-events-none before:absolute before:left-0 before:bottom-[-2px] before:h-[0.05em] before:w-full before:bg-current before:content-['']",
        "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] [motion-reduce:before:transition-none]",
        "hover:before:origin-left hover:before:scale-x-100",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <ArrowIcon className="translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100" />
    </BaseLink>
  );
};

/**
 * Link002: Underline with left-to-right origin and gliding arrow icon
 */
export const Link002 = ({ children, to, href, className, ...props }: AnimatedLinkProps) => {
  return (
    <BaseLink
      to={to}
      href={href}
      className={cn(
        "group relative inline-flex items-center",
        "before:pointer-events-none before:absolute before:left-0 before:bottom-[-2px] before:h-[0.05em] before:w-full before:bg-current before:content-['']",
        "before:origin-left before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] [motion-reduce:before:transition-none]",
        "hover:before:origin-right hover:before:scale-x-100",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <ArrowIcon className="translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100" />
    </BaseLink>
  );
};

/**
 * Link003: Center-origin expanding underline with arrow
 */
export const Link003 = ({ children, to, href, className, ...props }: AnimatedLinkProps) => {
  return (
    <BaseLink
      to={to}
      href={href}
      className={cn(
        "group relative inline-flex items-center",
        "before:pointer-events-none before:absolute before:left-0 before:bottom-[-2px] before:h-[0.05em] before:w-full before:bg-current before:content-['']",
        "before:origin-center before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] [motion-reduce:before:transition-none]",
        "hover:before:scale-x-100",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <ArrowIcon className="translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100" />
    </BaseLink>
  );
};

/**
 * Link004: Difference mix-blend background vertical highlight with rotating arrow
 */
export const Link004 = ({ children, to, href, className, ...props }: AnimatedLinkProps) => {
  return (
    <BaseLink
      to={to}
      href={href}
      className={cn(
        "group relative inline-flex items-center px-2 py-0.5",
        "before:pointer-events-none before:absolute before:left-0 before:bottom-0 before:h-0 before:w-full before:bg-foreground before:content-['']",
        "before:origin-center before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] [motion-reduce:before:transition-none]",
        "before:z-0 before:mix-blend-difference hover:before:h-full hover:before:scale-x-100",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <ArrowIcon className="relative z-10 ml-[0.5em] translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:rotate-45 group-hover:opacity-100" />
    </BaseLink>
  );
};

/**
 * Link005: Difference mix-blend horizontal highlight with slide arrow
 */
export const Link005 = ({ children, to, href, className, ...props }: AnimatedLinkProps) => {
  return (
    <BaseLink
      to={to}
      href={href}
      className={cn(
        "group relative inline-flex items-center px-2 py-0.5",
        "before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-full before:w-full before:bg-foreground before:content-['']",
        "before:origin-left before:scale-x-0 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] [motion-reduce:before:transition-none]",
        "before:z-0 before:mix-blend-difference hover:before:scale-x-100",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <ArrowIcon className="relative z-10 ml-[0.5em] -translate-x-1 rotate-45 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
    </BaseLink>
  );
};

/**
 * Skiper40 demo showcase component
 */
export const Skiper40 = () => {
  return (
    <section className="h-full snap-y snap-mandatory overflow-y-scroll">
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5">
        <Link001 href="mailto:hi@skiper-ui.com">hi@skiper-ui.com</Link001>
        <Link002 href="mailto:hi@skiper-ui.com">hi@skiper-ui.com</Link002>
        <Link003 href="mailto:hi@skiper-ui.com">hi@skiper-ui.com</Link003>
        <Link004 href="mailto:hi@skiper-ui.com">hi@skiper-ui.com</Link004>
        <Link005 href="mailto:hi@skiper-ui.com">hi@skiper-ui.com</Link005>
      </div>
    </section>
  );
};
